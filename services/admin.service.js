"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const DbService = require("../mixins/db.mixin");
const { findAndInsertMany, deleteManyRecord, insertMany, rawQuery, findAll, updateRecords, create, findbyQueryWithPagination, findbyQuery, findOne } = require('../utils/postgresUtils');
const { generateResponse } = require('../utils/utility');

const { default: axios } = require('axios');
const { getTotalUsersValidation, activeDeactiveUserValidation, createAndUpdatePlanValidation, paginationValidation, getPlanDetailsValidation, getPromptHistoryAdminValidation, getPromptAdminValidation } = require('../validation/adminValidation');

/** @type {ServiceSchema} */
module.exports = {
    name: "admin",
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
        getTotalUsers: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTotalUsers"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getTotalUsers : Service Starting `);

                    const roleName = ctx.meta.user.user_type
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {

                        let query = `SELECT COUNT(u.*) as "totalUsersCount" FROM users u`;

                        if (startDate && endDate) {
                            query += ` WHERE u."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        let totalCount = `SELECT COUNT(u.*) as "totalUsersCount" FROM users u`;

                        let [response2] = await rawQuery(this.db['sequelize'], totalCount);

                        const resp = generateResponse(true, 'Data Fetched Successfully', { totalUsersNewCount: (response) ? response.totalUsersCount : 0, totalUsersCount: (response2) ? response2.totalUsersCount : 0 });

                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getTotalUsers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error?.message };
                }
            }
        },
        getTotalOrders: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTotalOrders"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getTotalOrders : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalOrders : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {

                        let query = `SELECT COUNT(ord.*) as "totalOrdersCount" FROM orders ord `;

                        if (startDate && endDate) {
                            query += `where TO_DATE(ord."createdAt", 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}'`
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', { totalOrdersCounts: (response) ? response.totalOrdersCount : 0 });

                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }


                } catch (error) {
                    this.logger.info(`admin > getTotalOrders : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getTotalRevenue: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTotalRevenue"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getTotalRevenue : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalRevenue : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    if (roleName === 'admin') {

                        let query = `SELECT SUM(ord.order_amount) as "totalRevenueCount" FROM orders ord `;

                        if (startDate && endDate) {
                            query += `where TO_DATE(ord."createdAt", 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}'`
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', { totalRevenueCounts: (response) ? response?.totalRevenueCount : 0 });

                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getTotalRevenue : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getTotalPaidUsers: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTotalPaidUsers"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getTotalPaidUsers : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalPaidUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    if (roleName === 'admin') {
                        let query = `
                             SELECT COUNT(u.*) AS "totalPaidCount"
                             FROM users u
                             JOIN user_plans up ON u."user_id" = up."user_id"
                             JOIN plans p ON up."plan_id" = p."plan_id"
                             WHERE up."isActive" = true AND p."subsciption_type" = 'paid'
                            `;

                        if (startDate && endDate) {
                            query += `and TO_DATE(up."createdAt", 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}'`
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', { totalPaidCounts: (response) ? response?.totalPaidCount : 0 });

                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin > getTotalPaidUsers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getTotalFreeUsers: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTotalFreeUsers"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getTotalFreeUsers : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalFreeUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    if (roleName === 'admin') {

                        let query = `
                            SELECT COUNT(u.*) AS "totalFreeCount"
                            FROM users u
                            JOIN user_plans up ON u."user_id" = up."user_id"
                            JOIN plans p ON up."plan_id" = p."plan_id"
                            WHERE up."isActive" = true AND p."subsciption_type" = 'free'
                            `;

                        if (startDate && endDate) {
                            query += `and TO_DATE(up."createdAt", 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}'`
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', { totalFreeCounts: (response) ? response?.totalFreeCount : 0 });

                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin > getTotalFreeUsers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getAllUsersList: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAllUsersList"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getAllUsersList : Service Starting `);
                    const roleName = ctx.meta.user.user_type

                    const validate = paginationValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`expenses > fetchExpensesForApproval : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const page = (ctx.params.query.page) ? ((ctx.params.query.page === '0') ? 1 : ctx.params.query.page) : 1;
                    const limit = (ctx.params.query.limit) ? ctx.params.query.limit : 10;
                    const offset = page * limit - limit;
                    if (roleName === 'admin') {
                        const rawQueryString = `SELECT u."user_id", ud."first_name", ud."last_name",u."email",u."phone_number", p."plan_name", u.    "createdAt",u."isActive" FROM users u 
                            left join  "user_details"  ud  on   u."user_id" =  ud."user_id"
                            left join  "user_plans"  up  on   u."user_id" =  up."user_id"
                            left join  "plans"  p  on   up."plan_id" =  p."plan_id"
                            ORDER BY u."createdAt" DESC
				            LIMIT '${limit}' OFFSET ${offset}`;

                        const countQuery = await findbyQuery(`SELECT COUNT(u.*) AS count FROM users u`, this.db['sequelize'])

                        const response = await findbyQueryWithPagination(this.db['sequelize'], rawQueryString, page, limit, countQuery[0]?.count || 0);

                        if (response) {
                            const resp = generateResponse(true, 'Data Fetched Successfully', response);
                            this.logger.info(`admin > getAllUsersList : Data Fetched Successfully ${JSON.stringify(response)}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            return generateResponse(false, 'Not Found');
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getAllUsersList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        activeDeactiveUser: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/activeDeactiveUser"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > activeDeactiveUser : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const validate = await activeDeactiveUserValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalFreeUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { isActive, userId } = ctx.params.query;

                    if (roleName === 'admin') {

                        const response = await updateRecords(this.db['users'], { isActive }, { user_id: userId });

                        if (response) {
                            const resp = generateResponse(true, 'Data Fetched Successfully', response['updatedRecords'][0]);
                            this.logger.info(`admin > activeDeactiveUser : Data Fetched Successfully ${JSON.stringify(response['updatedRecords'][0])}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            return generateResponse(false, 'Not Found');
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > activeDeactiveUser : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getAllOrdersList: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAllOrdersList"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getAllOrdersList : Service Starting `);
                    const roleName = ctx.meta.user.user_type
                    const validate = paginationValidation.validate(ctx.params);
                    const page = (ctx.params.query.page) ? ((ctx.params.query.page === '0') ? 1 : ctx.params.query.page) : 1;
                    const limit = (ctx.params.query.limit) ? ctx.params.query.limit : 10;
                    const offset = page * limit - limit;

                    if (validate.error) {
                        this.logger.info(`expenses > fetchExpensesForApproval : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    if (roleName === 'admin') {

                        const rawQueryString = `SELECT od."order_id", od."razorpay_order_id", p.plan_name, up.plan_price, od."createdAt", od."payment_status"
                        FROM orders od
                        LEFT JOIN "user_plans" up ON up."user_plan_id" = od."user_plan_id"
                        LEFT JOIN plans p on p.plan_id = up.plan_id
                        ORDER BY od.order_id DESC
                        LIMIT '${limit}' OFFSET ${offset};`;

                        const countQuery = await findbyQuery(`SELECT COUNT(od.*) AS count FROM orders od`, this.db['sequelize'])

                        const response = await findbyQueryWithPagination(this.db['sequelize'], rawQueryString, page, limit, countQuery[0]?.count || 0);

                        if (response) {
                            const resp = generateResponse(true, 'Data Fetched Successfully', response);
                            this.logger.info(`admin > getAllOrdersList : Data Fetched Successfully ${JSON.stringify(response)}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            return generateResponse(false, 'Not Found');
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getAllOrdersList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getAllPlansList: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAllPlansList"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getAllPlansList : Service Starting `);
                    const roleName = ctx.meta.user.user_type

                    if (roleName === 'admin') {
                        const response = await findbyQuery(`SELECT pl."plan_id",pl."plan_name", pl.subsciption_type, pl.credits_offered, pl."price", pl."validity", pl."createdAt"
                        FROM plans pl
                        ORDER BY pl.plan_id DESC`, this.db['sequelize'])

                        if (response) {
                            const resp = generateResponse(true, 'Data Fetched Successfully', response);
                            this.logger.info(`admin > getAllPlansList : Data Fetched Successfully ${JSON.stringify(response)}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            return generateResponse(false, 'Not Found');
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getAllPlansList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        createAndUpdatePlan: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/createAndUpdatePlan"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > createAndUpdatePlan : Service Starting ${ctx.params} `);
                    const roleName = ctx.meta.user.user_type
                    const { body } = ctx.params;
                    const validate = await createAndUpdatePlanValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalFreeUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {
                        if (body.plan_id) {
                            const response = await updateRecords(this.db['plans'], body, { plan_id: body.plan_id, isActive: true });
                            if (response["recordsUpdated"] === true) {
                                const resp = generateResponse(true, 'Data Update Successfully', response['updatedRecords'][0]);
                                this.logger.info(`admin > getAllPlansList : Data Update Successfully ${JSON.stringify(response)}`);
                                return resp;
                            } else {
                                ctx.meta.$statusCode = 404;
                                return generateResponse(false, 'Falied to update data');
                            }
                        }
                        else {

                            const response = await create(this.db['plans'], body);

                            if (response) {
                                const resp = generateResponse(true, 'Data Added Successfully', response);
                                this.logger.info(`admin > getAllPlansList : Data Added Successfully ${JSON.stringify(response)}`);
                                return resp;
                            } else {
                                ctx.meta.$statusCode = 404;
                                return generateResponse(false, 'Falied to add data');
                            }
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin > createAndUpdatePlan : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getPlanDetails: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPlanDetails/:plan_id"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin >  getPlanDetails : Service Starting ${ctx.params} `);
                    const roleName = ctx.meta.user.user_type
                    const { plan_id } = ctx.params.params;
                    const validate = await getPlanDetailsValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getTotalFreeUsers : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {
                        const response = await findOne(this.db['plans'], { plan_id });
                        if (response) {
                            const resp = generateResponse(true, 'Data Fetched Successfully', response);
                            this.logger.info(`admin > getPlanDetails : Data Fetched Successfully ${JSON.stringify(response)}`);
                            return resp;

                        }
                        else {
                            ctx.meta.$statusCode = 404;
                            return generateResponse(false, 'Not Data Found');
                        }
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin >  getPlanDetails : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getMostFocusUsed: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getMostFocusUsed"
            },
            async handler(ctx) {
                try {
                    this.logger.info("admin > getMostFocusUsed : Service Starting");

                    const roleName = ctx.meta.user.user_type;
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getMostFocusUsed : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', validate.error.message.replace(/\"/g, ''));
                    }

                    if (roleName === 'admin') {

                        let query = `
                            SELECT
                                COUNT(CASE WHEN ph.focus_type = 'youtube' THEN 1 END) AS "youtube_count",
                                COUNT(CASE WHEN ph.focus_type = 'news' THEN 1 END) AS "news_count",
                                COUNT(CASE WHEN ph.focus_type = 'news_bing' THEN 1 END) AS "news_bing_count",
                                COUNT(CASE WHEN ph.focus_type = 'fund' THEN 1 END) AS "fund_count",
                                COUNT(CASE WHEN ph.focus_type = 'screener' THEN 1 END) AS "screener_count",
                                COUNT(CASE WHEN ph.focus_type = 'reddit' THEN 1 END) AS "reddit_count"
                            FROM prompt_history ph
                        `;

                        if (startDate && endDate) {
                            query += ` WHERE TO_DATE(ph."createdAt", 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        let [response] = await rawQuery(this.db['sequelize'], query);

                        let totalQuery = `
                            SELECT
                                COUNT(CASE WHEN ph.focus_type = 'youtube' THEN 1 END) AS "youtube_count",
                                COUNT(CASE WHEN ph.focus_type = 'news' THEN 1 END) AS "news_count",
                                COUNT(CASE WHEN ph.focus_type = 'news_bing' THEN 1 END) AS "news_bing_count",
                                COUNT(CASE WHEN ph.focus_type = 'fund' THEN 1 END) AS "fund_count",
                                COUNT(CASE WHEN ph.focus_type = 'screener' THEN 1 END) AS "screener_count",
                                COUNT(CASE WHEN ph.focus_type = 'reddit' THEN 1 END) AS "reddit_count"
                            FROM prompt_history ph
                        `;
                        let [response2] = await rawQuery(this.db['sequelize'], totalQuery);

                        let activeUsers = `
                            SELECT COUNT(*) as "activeUsersCount"
                            FROM users u
                        `;

                        if (startDate && endDate) {
                            activeUsers += `WHERE u."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        let [activeUsersResponse] = await rawQuery(this.db['sequelize'], activeUsers);
                        const activeUsersCount = activeUsersResponse ? activeUsersResponse.activeUsersCount : 0;
                        const totalFocusCount =
                            (Number(response2.youtube_count) || 0) +
                            (Number(response2.news_count) || 0) +
                            (Number(response2.news_bing_count) || 0) +
                            (Number(response2.fund_count) || 0) +
                            (Number(response2.screener_count) || 0) +
                            (Number(response2.reddit_count) || 0);

                        const totalFocusCountWithoutDates =
                            (Number(response.youtube_count) || 0) +
                            (Number(response.news_count) || 0) +
                            (Number(response.news_bing_count) || 0) +
                            (Number(response.fund_count) || 0) +
                            (Number(response.screener_count) || 0) +
                            (Number(response.reddit_count) || 0);

                        const averageSearchesPerUser = activeUsersCount > 0 ? totalFocusCountWithoutDates / activeUsersCount : 0;
                        const resp = generateResponse(true, 'Data Fetched Successfully', {
                            youtube_count: response.youtube_count || 0,
                            news_count: response.news_count || 0,
                            news_bing_count: response.news_bing_count || 0,
                            fund_count: response.fund_count || 0,
                            screener_count: response.screener_count || 0,
                            reddit_count: response.reddit_count || 0,
                            total_focus_count_custom_dates: totalFocusCountWithoutDates,
                            total_focus_count: totalFocusCount,
                            average_searches_per_user: averageSearchesPerUser
                        });

                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Unauthorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getMostFocusUsed : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getAverageSearchesPerUser: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAverageSearchesPerUser"
            },
            async handler(ctx) {
                try {
                    this.logger.info("admin > getAverageSearchesPerUser : Service Starting");

                    const roleName = ctx.meta.user.user_type;
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`admin > getAverageSearchesPerUser : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {

                        let query = `SELECT COUNT(p.*) as "totalSearchesCount" FROM prompts p `;
                        if (startDate && endDate) {
                            query += `WHERE p."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        let [searchResponse] = await rawQuery(this.db['sequelize'], query);

                        const totalSearchesCount = searchResponse ? searchResponse.totalSearchesCount : 0;

                        let totalSearches = `SELECT COUNT(p.*) as "totalSearchesCount" FROM prompts p `;

                        let [searchResponse2] = await rawQuery(this.db['sequelize'], totalSearches);

                        const searchesCount = searchResponse2 ? searchResponse2.totalSearchesCount : 0;

                        let activeUsers = `
                            SELECT COUNT(*) as "activeUsersCount"
                            FROM users u
                            WHERE u."isActive" = true
                        `;

                        if (startDate && endDate) {
                            activeUsers += `AND u."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        let [activeUsersResponse] = await rawQuery(this.db['sequelize'], activeUsers);
                        const activeUsersCount = activeUsersResponse ? activeUsersResponse.activeUsersCount : 0;

                        const averageSearchesPerUser = activeUsersCount > 0 ? totalSearchesCount / activeUsersCount : 0;

                        const resp = generateResponse(true, 'Data Fetched Successfully', {
                            searchesCount,
                            totalSearchesCount,
                            averageSearchesPerUser
                        });

                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin > getAverageSearchesPerUser : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        getActiveUsersOnDifferentDays: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getActiveUsersOnDifferentDays"
            },
            async handler(ctx) {
                try {
                    this.logger.info("admin > getActiveUsersOnDifferentDays : Service Starting");

                    const roleName = ctx.meta.user.user_type;
                    const { startDate, endDate } = ctx.params.query;
                    const validate = await getTotalUsersValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`admin > getActiveUsersOnDifferentDays : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {
                        let query = `
                        SELECT 
                            p."user_id",
                            COUNT(DISTINCT CAST(p."createdAt" AS DATE)) AS "distinctDays"
                        FROM prompts p
                        `;

                        if (startDate && endDate) {
                            query += ` WHERE p."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'`;
                        }

                        query += `
                            GROUP BY p."user_id"
                            HAVING COUNT(DISTINCT CAST(p."createdAt" AS DATE)) >= 2
                        `;

                        let usersResponse = await rawQuery(this.db['sequelize'], query);

                        if (Array.isArray(usersResponse) && usersResponse.length > 0) {
                            const userCount = usersResponse.length;
                            this.logger.info('Total Users: ', userCount);

                            const userData = usersResponse.map(user => ({
                                user_id: user.user_id,
                                distinctDays: user.distinctDays
                            }));

                            const resp = generateResponse(true, 'Data Fetched Successfully', {
                                userCount,
                                users: userData
                            });
                            return resp;
                        } else {
                            return generateResponse(false, 'No Data Found');
                        }
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Un Authorized');
                    }
                } catch (error) {
                    this.logger.info(`admin > getActiveUsersOnDifferentDays : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error?.message };
                }
            }
        },
        getPromptHistoryAdmin: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPromptHistoryAdmin"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getPromptHistoryAdmin : Service Starting`);

                    const roleName = ctx.meta.user.user_type;
                    const { prompt_id } = ctx.params.query;

                    const validate = await getPromptHistoryAdminValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`admin > getPromptHistoryAdmin : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {
                        const query = `
                            SELECT *
                            FROM prompt_history
                            WHERE prompt_history.prompt_id = ${prompt_id}
                        `;

                        const response = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', response);

                        this.logger.info(`admin > getPromptHistoryAdmin : Data Fetched Successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Unauthorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getPromptHistoryAdmin : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error?.message };
                }
            }
        },
        getPromptsAdmin: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPromptsAdmin"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`admin > getPromptsAdmin : Service Starting`);

                    const roleName = ctx.meta.user.user_type;
                    const { startDate, endDate, page = 1, limit = 10 } = ctx.params.query;

                    const validate = await getPromptAdminValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`admin > getPromptsAdmin : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    if (roleName === 'admin') {
                        const offset = (page - 1) * limit;

                        const query = `
                            SELECT p."prompt_id", p."user_id", p."prompt_text", p."createdAt",
                                   u."first_name", u."last_name"
                            FROM prompts p
                            LEFT JOIN user_details u ON u."user_id" = p."user_id"
                            ${startDate && endDate ? `WHERE p."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'` : ''}
                            ORDER BY p."prompt_id" DESC
                            LIMIT ${limit} OFFSET ${offset}
                        `;


                        const countQuery = `
                            SELECT COUNT(*) AS count
                            FROM prompts p
                            LEFT JOIN user_details u ON u."user_id" = p."user_id"
                            ${startDate && endDate ? `WHERE p."createdAt"::DATE BETWEEN '${startDate}' AND '${endDate}'` : ''}
                        `;

                        const countResult = await rawQuery(this.db['sequelize'], countQuery);
                        const totalRecords = countResult[0]?.count || 0;

                        const response = await rawQuery(this.db['sequelize'], query);

                        const resp = generateResponse(true, 'Data Fetched Successfully', {
                            data: response,
                            totalRecords,
                            currentPage: page,
                            limit: limit,
                            totalPages: Math.ceil(totalRecords / limit)
                        });

                        this.logger.info(`admin > getPromptsAdmin : Data Fetched Successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Unauthorized');
                    }

                } catch (error) {
                    this.logger.info(`admin > getPromptsAdmin : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error?.message };
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

