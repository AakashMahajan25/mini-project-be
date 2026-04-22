"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne,updateRecords, findAndCountAll } = require("../utils/postgresUtils");
const { generateResponse, generateOtp, EmailConfig } = require("../utils/utility.js");
const moment = require("moment");
const { Sequelize } = require("sequelize");
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "pushNotification",
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
        list: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`pushNotification > list : Service Starting`);
                    const { query } = ctx.params;
                    const { user_id } = ctx.meta.user;

					const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
					const limit = (query.limit) ? query.limit : 10;
					const offset = page * limit - limit;

                    const response = await findAndCountAll(this.db['push_notifications'],{user_id }, null, {}, limit,page, offset);
					if (response) {
						const resp = await generateResponse(true, 'Success', 'Push Notification fetch successfully', response);
						this.logger.info(`pushNotification > list : Push Notification fetch successfully`);
						return resp;
					} else {
						ctx.meta.$statusCode = 400;
						this.logger.error(`pushNotification > list : Push Notification does not exist`);
						return await generateResponse(false,'Not Found','Push Notification does not exist.');
					}
                } catch (error) {
                    this.logger.info(`pushNotification > list : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
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
        async sendMobileOTP(mobile, otp){
            return new Promise(async (resolve, reject) => {
                try {
                    const res = await axios({
                        method: 'get',
                        url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${mobile}/${otp}/Sign up OTP`,
                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    });
                    resolve(res.data);
                } catch (err) {
                    reject(err);
                }
        
            });
        }

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
