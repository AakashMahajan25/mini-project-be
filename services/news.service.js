"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, bulkInsertData, findAndCountAll, findbyQueryWithPagination, findbyQuery } = require("../utils/postgresUtils");
const { generateResponse, generateOtp, EmailConfig } = require("../utils/utility.js");
const { getNews } = require('../utils/alphavantageHelper');
const { newsDetailsValidation, getCorporateNewsByCompanyIdValidation } = require('../validation/newsValidation');
const {fetchReferenceNews} = require('../utils/polygonHelper')
const fetch = require('node-fetch');
const { default: axios } = require('axios');
require('dotenv').config();
const SocketIOService = require("moleculer-io");
const { Sequelize, Op } = require('sequelize');
const moment = require('moment')

/** @type {ServiceSchema} */
module.exports = {
    name: "news",
    mixins: [
        DbService,
        SocketIOService
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

        fetchAllNews: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/fetchAllNews"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`News > fetchAllNews : Service Starting `);
                    const { query } = ctx.params;
                    const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
					const limit = (query.limit) ? query.limit : undefined;
					const offset = limit ? page * limit - limit : 0;
                    const sentiment = query.sentiment;
                    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
                    const todayDate = new Date().toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    const startDate = moment().format('MM/DD/YYYY')
                    const endDate = moment().subtract(5, 'days').format('MM/DD/YYYY');

                    let sentimentCondition = '';
                    if (sentiment === 'neutral') {
                        sentimentCondition += `AND ns."sentiment" =  'Neutral'`;
                    }
                    if (sentiment === 'bullish') {
                        sentimentCondition += `AND ns."sentiment" = 'Bullish'`;
                    }
                    if (sentiment === 'veryBullish') {
                        sentimentCondition += `AND ns."sentiment" = 'Very bullish'`;
                    }
                    if (sentiment === 'bearish') {
                        sentimentCondition += `AND ns."sentiment" = 'Bearish'`;
                    }
                    if (sentiment === 'veryBearish') {
                        sentimentCondition += `AND ns."sentiment" = 'Very bearish'`;
                    }

                    const rawQueryString = ` SELECT cmn.*, ns."sentiment"  FROM "capitalMarketNews" AS "cmn" 
                    LEFT JOIN "newsSentiment" ns on ns."sno" = cmn."sno"
                    WHERE TO_DATE(cmn."date", 'MM/DD/YYYY') BETWEEN '${endDate}' AND '${startDate}'${sentimentCondition}
                    ORDER BY cmn."sno" ${sortOrder} OFFSET ${offset};`

                    const filterCount = await findbyQuery(
                        `SELECT COUNT(*) AS count
                    FROM "capitalMarketNews" AS "cmn"
                    LEFT JOIN "newsSentiment" ns ON ns."sno" = cmn."sno"
                    WHERE TO_DATE(cmn."date", 'MM/DD/YYYY') BETWEEN '${endDate}' AND '${startDate}'${sentimentCondition};`,
                        this.db['sequelize']
                    );

                    const data = await findbyQueryWithPagination(this.db['sequelize'], rawQueryString, page, limit, filterCount[0].count)
                    // const response = await findAndCountAll(this.db['capitalMarketNews'],{ date: { [Sequelize.Op.like]: `%${todayDate}%` }  }, [['sno', 'desc']], {}, limit,page, offset);

                    const resp = await generateResponse(true, 'News fetched successfully', data);
                    this.logger.info(`News > fetchAllNews : News fetched successfully`);
                    return resp;
                } catch (error) {
                    this.logger.info(`news > fetchAllNews : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },


        trending: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/trending"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`News > Trending news : Service Starting `);

                    const temp = []

                    const response = await getNews(this.logger);
                    this.logger.info(`News > Trending news : getNews response: ${JSON.stringify(response)}`);

                    // Check if response exists and is an array
                    if (!response || !Array.isArray(response)) {
                        this.logger.warn(`News > Trending news : Invalid response from getNews: ${response}`);
                        return generateResponse(false, 'No news data available', []);
                    }

                    response.map(el => {
                        let obj = {
                            title: el.title,
                            summary: el.summary,
                            newsLink: el.url,
                            image: el.banner_image,
                            source: el.source,
                            topics: el.topics,
                            timeStamp: el.time_published,
                        }
                        temp.push(obj)
                    })

                    this.logger.info(`News > Trending News : Data Fetched Successfully, processed ${temp.length} items`);
                    return generateResponse(true, 'News fetched successfully', temp);

                } catch (error) {
                    this.logger.info(`news > Trending news : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        referenceNews: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/reference"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`News > Reference news : Service Starting `);

                    const response = await fetchReferenceNews(ctx.params.query, this.logger)

                    if (response) {
                        this.logger.info(`News > Reference News : Data Fetched Successfully ${JSON.stringify(response)}`);
                        const resp = generateResponse(true, 'News fetched successfully', response);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Unable to fetch News');
                    }

                } catch (error) {
                    this.logger.info(`News > Reference news : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error || 'Something Went Wrong');
                }
            }
        },

        details: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/details/:newsId"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`news > news details by id : Service Starting `);
                    const validation = newsDetailsValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`News > News details param : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }
                    // const response = await findAll(this.db['news'], { isActive: true },projection);
                    const response = {
                            id:1,
                            image_url:"https://dummyimage.com/600x400/000/fff",
                            title:"List of U.S IPOS With other amounts greater than US $I bb doing back...",
                            category:"The Wall Street Journal",
                            last_updated:"1 Hour Ago"

                        };
                    if (response) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`news > news details by id : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.info(`news > news details by id : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getCorporateNewsByCompanyId: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCorporateNewsByCompanyId"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`news > getCorporateNewsByCompanyId : Service Starting `);
                    const validation = getCorporateNewsByCompanyIdValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`News > getCorporateNewsByCompanyId : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    let { companyId, limit } = ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/NewDetails/${companyId}/CorporateNews/${limit}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    await bulkInsertData(this.db['corporate_news'], response.data.data);
                    return generateResponse(true, 'Company Fetched successfully', response.data.data || []);
                } catch (error) {
                    this.logger.info(`news > getCorporateNewsByCompanyId : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error.message || 'Something Went Wrong' };
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
