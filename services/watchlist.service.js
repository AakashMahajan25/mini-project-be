"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, updateRecords, findOne, findAndCountAll, rawQuery} = require("../utils/postgresUtils");
const { generateResponse } = require("../utils/utility.js");
const { deleteWatchListValidation, editWatchListValidation, addWatchListValidation, addTickertoWatchListValidation, removeTickerFromWatchListValidation, fetchWatchListTickerByWatchlist} = require('../validation/watchlistValidation');
const { getQuote } = require('../utils/alphavantageHelper');
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "watchlist",
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
        fetchWatchList: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/fetchWatchList"
            },
            async handler(ctx) {
                try {
                    const {user_id} =  ctx.meta.user;
                    this.logger.info(`watchlist > fetchWatchList : Service Starting`);
                    const response = await rawQuery(this.db['sequelize'], `SELECT w.watchlist_id, w.watchlist_name, (select count(*) from watchlist_stocks ws where ws.watchlist_id = w.watchlist_id and ws."isActive" = true) as stockCount FROM public.watchlists w where w."isActive" = true and user_id = ${user_id} order by w.watchlist_id desc`);
                    if (response) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`watchlist > fetchWatchList : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.info(`watchlist > fetchWatchList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        deleteWatchList: {
            auth: "required",
            rest: {
                method: "DELETE",
                path: "/deleteWatchList"
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    const { user_id } = ctx.meta.user;

                    this.logger.info(`watchlist > deleteWatchList : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = deleteWatchListValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`watchlist > deleteWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { watchListId } = ctx.params.query;

                    const response = await updateRecords(this.db['watchlists'], { isActive: false }, { user_id, watchlist_id: watchListId }, t);
                    if (response['recordsUpdated']) {
                        // const tickerResponse =
                         await updateRecords(this.db['watchlist_stocks'], { isActive: false }, {  watchlist_id: watchListId }, t);
                        // if (tickerResponse['recordsUpdated']) {
                            t.commit();
                            const resp = generateResponse(true, 'Watchlist Deleted Successfully');
                            this.logger.info(`watchlist > deleteWatchList : Watchlist Deleted Successfully ${JSON.stringify(response)}`);
                            return resp;
                        // } else {
                        //     t.rollback();
                        //     ctx.meta.$statusCode = 400;
                        //     return generateResponse(false, 'No Record Found to update');
                        // }
                    } else {
                        t.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in deleting watchlist');
                    }
                } catch (error) {
                    t.rollback();
                    this.logger.info(`watchlist > deleteWatchList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        editWatchList: {
            auth: "required",
            rest: {
                method: "PUT",
                path: "/editWatchList"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user;

                    this.logger.info(`watchlist > editWatchList : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = editWatchListValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`watchlist > editWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { watchListId } = ctx.params.query;
                    const { watchlist_name } = ctx.params.body;

                    const response = await updateRecords(this.db['watchlists'], { watchlist_name }, { isActive:true, user_id, watchlist_id: watchListId });
                    if (response['recordsUpdated']) {
                        const resp = generateResponse(true, 'Watchlist Updated Successfully');
                        this.logger.info(`watchlist > editWatchList : Watchlist Updated Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in updating watchlist');
                    }
                } catch (error) {
                    this.logger.info(`watchlist > editWatchList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        addWatchList: {
            auth: "required",
            rest: {
                method: "PUT",
                path: "/addWatchList"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user;
                    this.logger.info(`watchlist > addWatchList : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = addWatchListValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`watchlist > addWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { watchlist_name } = ctx.params.body;

                    const response = await create(this.db['watchlists'], { watchlist_name, user_id });
                    if (response) {
                        const resp = generateResponse(true, 'Watchlist Added Successfully');
                        this.logger.info(`watchlist > addWatchList : Watchlist Added Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in adding watchlist');
                    }
                } catch (error) {
                    this.logger.info(`watchlist > addWatchList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        addTickertoWatchList: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/addTickertoWatchList"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user;
                    this.logger.info(`watchlist > addTickertoWatchList : Service Starting ${JSON.stringify(ctx.params)}`);
                    const { watchlist_id, ticker, ticker_name, cocode } = ctx.params.body;

                    // const quoteResponse = await getQuote(ticker, this.logger);
                    // if(!quoteResponse){
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = generateResponse(false, 'Error fetching Stock Details');
                    //     this.logger.info(`watchlist > addTickertoWatchList : Error fetching Stock Details`);
                    //     return resp;
                    // }

                    const params = {
                        watchlist_id,
                        ticker,
                        ticker_name,
                        cocode
                        // ticker_price : quoteResponse['Global Quote']["05. price"],
                        // ticker_open : quoteResponse['Global Quote']["02. open"],
                        // ticker_high : quoteResponse['Global Quote']["03. high"],
                        // ticker_low :quoteResponse['Global Quote']["04. low"],
                        // ticker_volume : quoteResponse['Global Quote']["06. volume"],
                        // ticker_latest_trading_day : quoteResponse['Global Quote']["07. latest trading day"],
                        // ticker_previous_close : quoteResponse['Global Quote']["08. previous close"],
                        // ticker_change : quoteResponse['Global Quote']["09. change"],
                        // ticker_change_percent : quoteResponse['Global Quote']["10. change percent"]
                    };

                    const validate = addTickertoWatchListValidation.validate({
                        params
                    });
                    if (validate.error) {
                        this.logger.info(`watchlist > addTickertoWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return await generateResponse(false, `${validate.error.message.replace(/\"/g, '')}`);
                    }


                    const ifExists = await findOne(this.db['watchlists'], { isActive: true, user_id, watchlist_id}, {});

                    if(!ifExists){
                        ctx.meta.$statusCode = 404;
                        const resp = await generateResponse(false, 'Watchlist Not Found');
                        this.logger.info(`watchlist > addTickertoWatchList : Watchlist Not Found`);
                        return resp;
                    }

                    const ifTickerExists = await findOne(this.db['watchlist_stocks'], { isActive: true, cocode, watchlist_id}, {});

                    if(ifTickerExists){
                        ctx.meta.$statusCode = 400;
                        const resp = await generateResponse(false, 'Stock Already Exist');
                        this.logger.info(`watchlist > addTickertoWatchList : Stock Already Exist`);
                        return resp;
                    }                    

                    const response = await create(this.db['watchlist_stocks'], params);
                    if (response) {
                        const resp = await generateResponse(true, 'Watchlist Stock Added Successfully');
                        this.logger.info(`watchlist > addTickertoWatchList : Watchlist Stock Added Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return await generateResponse(false, 'Error in adding watchlist stock');
                    }
                } catch (error) {
                    console.log("error", error);
                    this.logger.info(`watchlist > addTickertoWatchList : Internal Server Error : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return await generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        removeTickerFromWatchList: {
            auth: "required",
            rest: {
                method: "DELETE",
                path: "/removeTickerFromWatchList"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`watchlist > removeTickerFromWatchList : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = removeTickerFromWatchListValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`watchlist > removeTickerFromWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { watchListTickerId } = ctx.params.query;

                    const response = await updateRecords(this.db['watchlist_stocks'], { isActive: false }, { id: watchListTickerId });
                    if (response['recordsUpdated']) {
                        const resp = generateResponse(true, 'Ticker Removed Successfully');
                        this.logger.info(`watchlist > removeTickerFromWatchList : Ticker Removed Successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`watchlist > removeTickerFromWatchList : Error in removing ticker`);
                        return generateResponse(false, 'Error in removing ticker');
                    }
                } catch (error) {
                    this.logger.info(`watchlist > removeTickerFromWatchList : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        fetchWatchListTickerByWatchlist: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/fetchWatchListTickerByWatchlist"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`watchlist > fetchWatchListTickerByWatchlist : Service Starting`);
                    const { query } = ctx.params;
                    const { user_id } = ctx.meta.user;

                    const validate = fetchWatchListTickerByWatchlist.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`watchlist > deleteWatchList : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
					const limit = (query.limit) ? query.limit : 10;
					const offset = page * limit - limit;

                    const { watchListId } = ctx.params.query;

                    const response = await findAndCountAll(this.db['watchlist_stocks'],{watchlist_id : watchListId, isActive : true}, null, ['id','ticker','watchlist_id' ,'ticker_name','ticker_price','ticker_change','ticker_change_percent','cocode'], limit,page, offset);
                    if (response) {
                        const resp = await generateResponse(true, 'Ticker fetched successfully', response);
                        this.logger.info(`watchlist > fetchWatchListTickerByWatchlist : Ticker fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.error(`watchlist > fetchWatchListTickerByWatchlist : Ticker does not exist`);
                        return await generateResponse(false, 'Not Found', 'Ticker does not exist.');
                    }
                } catch (error) {
                    this.logger.info(`watchlist > fetchWatchListTickerByWatchlist : Internal Server Error : ${error}`);
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
