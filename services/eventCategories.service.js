"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, updateRecords, findAll, findOne, findAndCountAll} = require("../utils/postgresUtils");
const { generateResponse } = require("../utils/utility.js");
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "eventCategories",
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
        
        fetchEventCategories: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/fetchEventCategories"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`eventCategories > fetchEventCategories : Service Starting`);
                    const { query } = ctx.params;
                    // const { user_id } = ctx.meta.user;

					const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
					const limit = (query.limit) ? query.limit : 10;
					const offset = page * limit - limit;

                    const response = await findAndCountAll(this.db['event_categories'],{isActive : true}, null, {}, limit,page, offset);
                    if (response) {
                        const resp = await generateResponse(true, 'event category successfully', response);
                        this.logger.info(`eventCategories > fetchEventCategories : event category successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.error(`eventCategories > fetchEventCategories : event category does not exist`);
                        return await generateResponse(false, 'Not Found', 'event category does not exist.');
                    }
                } catch (error) {
                    this.logger.info(`eventCategories > fetchEventCategories : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchtrendingEvents: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/fetchtrendingEvents"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`eventCategories > fetchtrendingEvents : Service Starting`);

                    const response = await findAll(this.db['qa_responses']);
                    if (response) {
                        const resp = generateResponse(true, 'Trending events fetched successfully', response);
                        this.logger.info(`eventCategories > fetchtrendingEvents : Trending events fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.error(`eventCategories > fetchtrendingEvents : Trending events does not exist`);
                        return generateResponse(false, 'Not Found', 'Trending events does not exist');
                    }
                } catch (error) {
                    this.logger.info(`eventCategories > fetchEventCategories : Internal Server Error : ${error}`);
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
