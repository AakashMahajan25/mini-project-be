"use strict";

const Razorpay = require('razorpay');
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, getById, rawQuery, findbyQuery, findbyQueryWithPagination } = require("../utils/postgresUtils");
const { generateResponse, EmailConfig } = require("../utils/utility.js");
const { placeOrderValidation, orderIdValidation, initiateOrderValidation } = require('../validation/orderValidation');
require('dotenv').config();
const moment = require("moment");
const { Sequelize } = require("sequelize");
const { planBuyTemplate } = require('../utils/emailTemplates.js');
const Nodemailer = require('nodemailer');

/** @type {ServiceSchema} */
module.exports = {
    name: "order",
    mixins: [
        DbService
    ],
    /**
     * Settings
     */
    settings: {

    },

    /**
     * Dependencies
     */
    dependencies: [],

    /**
     * Actions
     */
    actions: {
        initiateOrder: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/initiateOrder"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Order > initiateOrder : Service Starting`);
                    const { user_id } = ctx.meta.user;
                    const { body } = ctx.params;

                    const { plan_id } = ctx.params.body;

                    const plan = await findOne(this.db['plans'], { plan_id});

                    if(!plan){
                        this.logger.info(`Order > initiateOrder : Plan does not exits`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Plan does not exits');
                    }

                    const instance = new Razorpay({
                        key_id: process.env.RAZORPAY_KEY_ID,
                        key_secret: process.env.RAZORPAY_SECRET,
                    });

                    const razorpayPayload = {
                        currency : "INR",
                        amount: plan.price * 100
                    }

                    const payload = {
                        plan_id: body.plan_id,
                        user_id,
                        order_amount: plan.price
                    }
                    const validate = await initiateOrderValidation.validate({
                        body : payload
                    });
                    if (validate.error) {
                        this.logger.info(`Order > initiateOrder : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    // Need to check whether already an active plan is present or not
                    // const existingActivePlan = await rawQuery(this.db['sequelize'], `select "user_plans".* FROM "user_plans" AS "user_plans" join "plans" p on p.plan_id = user_plans.plan_id where p."subsciption_type" != 'free' and "user_plans"."user_id" = '${user_id}' AND p."isActive" = true AND "user_plans"."expiry_date" >= '${currentDate}' LIMIT 1`);

                    // if (existingActivePlan.length > 0) {
                    //     ctx.meta.$statusCode = 403;
                    //     this.logger.info(`Order : Active Plan Already Exist`);
                    //     return await generateResponse(false, 'Active Plan Already Exist');
                    // }

                    const order = await instance.orders.create(razorpayPayload);
                    if (!order){
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Order : Failed to initiate order`);
                        return await generateResponse(false, 'Failed to initiate order');
                    }

                    const response = await create(this.db['orders'], {
                        ...payload,
                        razorpay_order_id : order.id
                    });

                    if (response !== null) {
                        const resp = await generateResponse(true, 'Order Initiated successfully', {...response, plan_id});
                        this.logger.info(`Order : Order Initiated successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Order : Failed to initiate order`);
                        return await generateResponse(false, 'Failed to initiate order');
                    }
                } catch (error) {
                    this.logger.error(`Error : Initiate Payment : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || error.error.description || 'Something went wrong, Please try again', error)
                }
            }
        },

        placeOrder: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/placeOrder"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`Place Order > placeorder : Service Starting ${JSON.stringify(ctx.params)}`);
                    const { user_id, email } = ctx.meta.user;
                    const validate = await placeOrderValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`Place Order > placeorder : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    // Need to check if initial record present or not
                    let { order_id } = ctx.params.body;

                    const orderDetail = await findOne(this.db['orders'], { order_id, payment_status : 'pending'});
                    if (!orderDetail) {
                        this.logger.info(`Place Order : No initial order found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Invalid Order');
                    }

                    const payload = Object.assign({}, ctx.params.body);

                    let requestData = {};
                    const currentPlan = await findOne(this.db['plans'], { plan_id: payload.plan_id }, transaction);

                    if (currentPlan) {
                        const expiry_date = moment().utc().add(currentPlan.validity, 'days').format('YYYY-MM-DD');
                        requestData.expiry_date = (currentPlan.subsciption_type === 'paid')?expiry_date:'2099-01-01';
                        requestData.plan_price = currentPlan.price;
                        requestData.credits_used = 0;
                        requestData.credit_at_purchase = currentPlan.credits_offered;
                    } else {
                        this.logger.info(`Place Order : plan does not  exist `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'The Plan does not exist.');
                    }

                   await updateRecords(this.db['user_plans'], { isActive : false }, {user_id}, transaction);

                    // Insert into user plans tables
                    const userPlanResponse = await create(this.db['user_plans'], { user_id, plan_id : payload.plan_id, ...requestData }, transaction);
                    if (!userPlanResponse) {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Order placeOrder : Failed to place order`);
                        return await generateResponse(false, 'Failed to place order');
                    }


                    const response = await updateRecords(this.db['orders'], { payment_status : payload.payment_status, razorpay_order_id : payload.razorpay_order_id, razorpay_signature: payload.razorpay_signature, razorpay_payment_id: payload.razorpay_payment_id , user_plan_id : userPlanResponse.user_plan_id}, {order_id : payload.order_id}, transaction);

                    if (response['recordsUpdated']) {

                        let mailOptions = {
                            from: EmailConfig.auth.user,
                            to: email,
                            subject: "Your Subscription",
                            attachments: [
                               {
                                   filename: 'planImage.png',
                                   path: './uploads/planImage.png',
                                   cid: 'planImage'
                               },
                               {
                                   filename: 'Data1.png',
                                   path: './uploads/Data1.png',
                                   cid: 'Data1'
                               },
                               {
                                   filename: 'Data2.png',
                                   path: './uploads/Data2.png',
                                   cid: 'Data2'
                               },
                               {
                                   filename: 'Data3.png',
                                   path: './uploads/Data3.png',
                                   cid: 'Data3'
                               },
                               {
                                   filename: 'Data4.png',
                                   path: './uploads/Data4.png',
                                   cid: 'Data4'
                               },
                               {
                                   filename: 'Data5.png',
                                   path: './uploads/Data5.png',
                                   cid: 'Data5'
                               },
                               {
                                   filename: 'Data6.png',
                                   path: './uploads/Data6.png',
                                   cid: 'Data6'
                               },
                               {
                                   filename: 'Data7.png',
                                   path: './uploads/Data7.png',
                                   cid: 'Data7'
                               },
                               {
                                   filename: 'Data8.png',
                                   path: './uploads/Data8.png',
                                   cid: 'Data8'
                               },
                               {
                                   filename: 'Data9.png',
                                   path: './uploads/Data9.png',
                                   cid: 'Data9'
                               },
                               {
                                   filename: 'Data10.png',
                                   path: './uploads/Data10.png',
                                   cid: 'Data10'
                               },
                               {
                                   filename: 'Data11.png',
                                   path: './uploads/Data11.png',
                                   cid: 'Data11'
                               },
                           ],
                           html: planBuyTemplate({creditsOffered: currentPlan.credits_offered, price: currentPlan.price}),
                        };

                        const transporter = Nodemailer.createTransport(EmailConfig);

                        let error = null;

                        await transporter.sendMail(mailOptions).catch(async (err) => {
                            error = err.message;
                        });

                        const resp = await generateResponse(true, 'Order placed successfully', {...response['updatedRecords'][0], credits_offered: currentPlan.credits_offered});
                        this.logger.info(`Place Order : Order placed successfully`);
                        transaction.commit();
                        return resp;
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Place Order : Failed to place order`);
                        return await generateResponse(false, 'Failed to place order');
                    }
                }
                catch (error) {
                    transaction.rollback();
                    this.logger.error(`Error : Place Order : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },
        getOrderDetails: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getOrderDetails/:orderId"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Get user order details : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validation = orderIdValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Order id params > orderId : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { user_id } = ctx.meta.user;
                    const { orderId } = ctx.params?.params;

                    if (!user_id) {
                        this.logger.info(`Get user order details : user does not  exist `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user does not exist');
                    }

                    const response = await findOne(this.db['orders'], { user_id: user_id, order_id: orderId });

                    if (response) {
                        const resp = await generateResponse(true, 'Order details fetched successfully', response);
                        this.logger.info(`Get user order details : Order details fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Get user order details : Failed to get user order details`);
                        return await generateResponse(false, 'No order details available');
                    }
                }
                catch (error) {
                    this.logger.error(`Error : Failed to get user order details : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },
        getUserOrders: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getUserOrders"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Get user order details : Service Starting ${JSON.stringify(ctx.params)}`);
                    const { user_id } = ctx.meta.user;
                    if (!user_id) {
                        this.logger.info(`Get user order history : user does not  exist `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user does not exist');
                    }
                    const { page } = ctx.params.query;

                    const pageNo = (page) ? ((page === '0') ? 1 : page) : 1;
                    const limit = 10;
                    const offset = (pageNo * limit) - limit;

                    const rawQuery = `SELECT od.*, p.plan_name, up.plan_price
                        FROM orders od
                        LEFT JOIN "user_plans" up ON up."user_plan_id" = od."user_plan_id"
                        LEFT JOIN plans p on p.plan_id = up.plan_id
                        WHERE od.user_id = ${user_id}
                        ORDER BY od.order_id DESC
                        LIMIT '${limit}' OFFSET ${offset};`

                    const filterCount = await findbyQuery(`
                        SELECT COUNT(DISTINCT od."order_id") AS "totalCount"
                        FROM orders od
                        left join "user_plans" up on up."user_plan_id" = od."user_plan_id"
                        where od.user_id=${user_id}`, this.db['sequelize'])

                    let response = await findbyQueryWithPagination(this.db['sequelize'], rawQuery, pageNo, limit, filterCount[0].totalCount);

                    if (response) {
                        const resp = await generateResponse(true, 'User order history fetched successfully', response);
                        this.logger.info(`Get user order history : User order history fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Get user order history : Failed to get user order history`);
                        return await generateResponse(false, 'No user order history available');
                    }
                }
                catch (error) {
                    this.logger.error(`Error : Failed to get user User order history : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        }
    },

    /**
     * Events
     */
    events: {

    },

    /**
     * Methods
     */
    methods: {
        async checkUserExist(userId) {
            try {
                const user = await findOne(this.db['users'], { user_id: userId });
                if (user) {
                    return user;
                } else {
                    return false;
                }
            } catch (error) {
                throw error
            }
        },
    },

    /**
     * Service created lifecycle event handler
     */
    created() {

    },

    /**
     * Service started lifecycle event handler
     */
    async started() {
    },

    /**
     * Service stopped lifecycle event handler
     */
    async stopped() {

    }
};
