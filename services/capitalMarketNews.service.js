"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const DbService = require("../mixins/db.mixin");
const { findAndInsertMany, deleteManyRecord, insertMany } = require('../utils/postgresUtils');
const { generateResponse } = require('../utils/utility');

const { default: axios } = require('axios');
const { getCapitalMarketNewsValidation } = require('../validation/capitalMarketValidation');

/** @type {ServiceSchema} */
module.exports = {
	name: "capitalMarketNews",
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
		getCapitalMarketNews: {
            // auth: "required",
            rest: {
                method: "GET",
                path: "/getCapitalMarketNews"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`capitalMarketNews > getCapitalMarketNews : Service Starting `);

					const validate = await getCapitalMarketNewsValidation.validate(ctx.params);

                    if (validate.error) {
                        transaction.rollback();
                        this.logger.info(`capitalMarketNews > getCapitalMarketNews : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { type } = ctx.params.query;

                    const newsType = {
                        hotPursuit: 'hot-pursuit',
                        corporateNews: 'corporate-news',
                        marketBeat: 'market-beat',
                        economyNews: 'economy-news',
                        corporateResults: 'corporate-results',
                        stockAlert: 'stock-alert',
                        preSession: 'pre-session',
                        midSession: 'mid-session',
                        endSession: 'end-session'
                    }
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CapitalMarketLiveNews/${newsType[type]}/0`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    const news=[]
					
                    if(response.data?.success === true && response.data.data){
                        for (const data of response.data.data) {
                            news.push({
                                ...data,
                                type
                            })
                        }
                        await deleteManyRecord(this.db['capitalMarketNews'],{type}, transaction)
                        await insertMany(this.db['capitalMarketNews'], news, { transaction })
                        // await findAndInsertMany(this.db['capitalMarketNews'], news, (row) => ({ sno: row.sno, type: row.type }), transaction)
                        transaction.commit();

                        if (news.length > 0) {
                            await ctx.call('api.broadcast', {
                                event: 'newNewsPushed'
                            });
                        }

                        return generateResponse(true, newsType[type]+' Fetched successfully', news);
                    }else{
                        transaction.rollback();
						this.logger.info(`capitalMarketNews > getCapitalMarketNews : Error in fetching capital market news `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in fetching capital market news', response.data.data);
                    }
                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`capitalMarketNews > getCapitalMarketNews : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
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

