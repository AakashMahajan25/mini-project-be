"use strict";

const { Sequelize } = require('sequelize');
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll } = require("../utils/postgresUtils");
const { generateResponse, generateOtp, EmailConfig } = require("../utils/utility.js");


/** @type {ServiceSchema} */
module.exports = {
    name: "plans",
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
            // auth: "required",
            rest: {
                method: "GET",
                path: "/"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`plans > fetchAllPlans : Service Starting `);
                    let projection = {};
                    if(ctx.params.query && ctx.params.query.limit){
                        projection.limit= ctx.params.query.limit;
                        projection.offset= ctx.params.query.offset?ctx.params.query.offset:0;
                    }
                    const response = await findAll(this.db['plans'], { isActive: true, price: {
                        [Sequelize.Op.gt]: 0
                    } },projection);
                    if (response) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`plans > listOfAllPlans : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.info(`plans > listOfAllPlans : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },
        // create:{
        //     // auth: "required",
        //     rest: {
        //         method: "Post",
        //         path: "/create"
        //     },
        //     async handler(ctx) {
        //         return generateResponse(true, 'Data Fetched Successfully', response);
        //     }
        // }
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
