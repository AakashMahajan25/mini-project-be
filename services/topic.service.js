"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, rawQuery } = require("../utils/postgresUtils");
const { generateResponse } = require("../utils/utility.js");
const { Sequelize } = require("sequelize");
const { searchTopicsValidation, getTopicsByUserIdValidation} = require('../validation/topicsValidation');
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "topic",
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
        getTopics: {
            rest: {
                method: "GET",
                path: "/getTopics",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Topics > getTopics : Service Starting`);

                    const response = await rawQuery(this.db['sequelize'], `SELECT
                        c."category_id",
                        c.category_name,
                        json_agg(json_build_object('topic_id', t."topic_id", 'topic_name', t.topic_name)) AS topics
                    FROM categories c
                    LEFT JOIN topics t ON c."category_id" = t."category_id"
                    WHERE c."isActive" = true
                    GROUP BY c."category_id"`);

                    if (response.length > 0) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`Topics > getTopics : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }


                } catch (error) {
                    this.logger.info(`Topics > getTopics : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        searchTopics: {
            rest: {
                method: "GET",
                path: "/searchTopics",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Topics > searchTopics : Service Starting`);

                    const validation = searchTopicsValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Topic > searchTopics : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { keyword } = ctx.params.query;

                    const response = await findAll(this.db['topics'], { isActive: true, topic_name: {
                        [Sequelize.Op.iLike]: `%${keyword}%`,
                    } },{});
                    
                    const resp = generateResponse(true, 'Data Fetched Successfully', response);
                    this.logger.info(`plans > listOfAllPlans : Data Fetched Successfully ${JSON.stringify(response)}`);
                    return resp;
                    
                } catch (error) {
                    this.logger.info(`Topics > getTopics : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getTopicsByUserId: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTopicsByUserId",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Topics > getTopicsByUserId : Service Starting`);
                    const { user_id } = ctx.meta.user;
                    
                    const validation = getTopicsByUserIdValidation.validate({query :{user_id}});
                    if (validation.error) {
                        this.logger.info(`Topic > getTopicsByUserId : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const response = await rawQuery(this.db['sequelize'], `
                    SELECT ut.user_topics_id, ut.user_id, ut.topic_id, ut."isActive", ut."createdAt", ut."updatedAt", t.topic_name
                    FROM user_topics ut
                    LEFT JOIN topics t ON ut.topic_id = t.topic_id
                    WHERE ut."isActive" = true AND ut.user_id = ${user_id}
                `);
                    
                    const resp = generateResponse(true, 'getTopics By UserId Fetched Successfully', response);
                    this.logger.info(`plans > listOfAllPlans : Data Fetched Successfully ${JSON.stringify(response)}`);
                    return resp;
                    
                } catch (error) {
                    this.logger.info(`Topics > getTopicsByUserId : Internal Server Error : ${error}`);
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
