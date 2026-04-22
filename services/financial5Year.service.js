"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin.js");
const { create, findOne, updateRecords, findAll, findAndCountAll, rawQuery, insertMany } = require("../utils/postgresUtils.js");
const { quarterlyResultsValidation, shareHoldingPatternValidation } = require('../validation/financial5YearValidation')
const { generateResponse } = require("../utils/utility.js");
const { default: axios } = require('axios');
require('dotenv').config();
const { Sequelize } = require("sequelize");

/** @type {ServiceSchema} */
module.exports = {
    name: "financial5Year",
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
        quarterlyResults: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/quarterlyResults/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > quarterlyResults : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > quarterlyResults : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/QuarterlyResults/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = response.data.data

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['quaterlyResults'], enrichedData);

                        const resp = await generateResponse(true, 'Quarterly Results fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > quarterlyResults : Quarterly Results fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > quarterlyResults : Failed to fetch quarterly results`);
                        return await generateResponse(false, 'Failed to fetch quarterly results');
                    }

                } catch (error) {
                    this.logger.error(`Error : Quarterly Results : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }

            },

        },


        pnLStatement: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/ProftandLoss/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > pnLStatement : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > pnLStatement : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ProftandLoss/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = response.data.data

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));


                        await insertMany(this.db['pnLStatement'], enrichedData,
                        );
                        const resp = await generateResponse(true, ' P&L Statement fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > pnLStatement :  P&L Statement fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > pnLStatement : Failed to fetch  P&L Statement`);
                        return await generateResponse(false, 'Failed to fetch  P&L Statement');
                    }

                } catch (error) {
                    this.logger.error(`Error : P&L Statement : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        balanceSheet: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/balanceSheet/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > balanceSheet : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > balanceSheet : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BalanceSheet/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['balanceSheet'], enrichedData,
                        );
                        const resp = await generateResponse(true, ' Balance Sheet fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > balanceSheet :  Balance Sheet fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > balanceSheet : Failed to fetch  Balance Sheet`);
                        return await generateResponse(false, 'Failed to fetch Balance Sheet');
                    }

                } catch (error) {
                    this.logger.error(`Error :Balance Sheet : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        cashFlow: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/cashFlow/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > cashFlow : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > cashFlow : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CashFlow/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['cashFlow'], enrichedData,
                        );
                        const resp = await generateResponse(true, 'Cash Flow fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > cashFlow :  Cash Flow fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > cashFlow : Failed to fetch Cash Flow`);
                        return await generateResponse(false, 'Failed to fetch Cash Flow');
                    }

                } catch (error) {
                    this.logger.error(`Error : Cash Flow : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        halfYearlyResults: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/halfYearlyResults/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > halfYearlyResults : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > halfYearlyResults : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Half-Yearly-Results/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['halfYearlyResults'], enrichedData,
                        );
                        const resp = await generateResponse(true, 'Half Yearly Results fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > halfYearlyResults : Half Yearly Results fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > halfYearlyResults : Failed to fetch Half Yearly Results`);
                        return await generateResponse(false, 'Failed to fetch Half Yearly Results');
                    }

                } catch (error) {
                    this.logger.error(`Error : Half Yearly Results : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        nineMonthResult: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/nineMonthResult/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > nineMonthResult : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > nineMonthResult : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Nine-Month-Result/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['nineMonthResult'], enrichedData,
                        );
                        const resp = await generateResponse(true, 'Nine Month Result fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > nineMonthResult : Nine Month Result fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > nineMonthResult : Failed to fetch Nine Month Result`);
                        return await generateResponse(false, 'Failed to fetch Nine Month Result');
                    }

                } catch (error) {
                    this.logger.error(`Error : Nine Month Result : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        shareHoldingPattern: {
            rest: {
                method: "GET",
                path: "/shareHoldingPattern/:cocode"
            },
            async handler(ctx) {
                try {
                    const { cocode } = ctx.params.params

                    this.logger.info(`financial5Year > shareHoldingPattern : Service Starting`);

                    const validate = await shareHoldingPatternValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > shareHoldingPattern : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ShareHoldingPatternDetailed/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            cocode: cocode,
                        }));

                        await insertMany(this.db['shareHoldingPattern'], enrichedData,
                        );
                        const resp = await generateResponse(true, 'Share Holding Pattern fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > shareHoldingPattern :Share Holding Pattern fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > shareHoldingPattern : Failed to fetch Share Holding Pattern`);
                        return await generateResponse(false, 'Failed to fetch Share Holding Pattern');
                    }

                } catch (error) {
                    this.logger.error(`Error :Share Holding Pattern : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        shareHoldingPatternMoreThan1: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/shareHoldingPatternMoreThan1/:cocode"
            },
            async handler(ctx) {
                try {
                    const { cocode } = ctx.params.params

                    this.logger.info(`financial5Year > shareHoldingPatternMoreThan1 : Service Starting`);

                    const validate = await shareHoldingPatternValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > shareHoldingPatternMoreThan1 : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ShareholdingMorethanonePerDetails/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            cocode: cocode,
                        }));


                        await insertMany(this.db['shareHoldingPatternMoreThan1'], enrichedData,
                        );
                        const resp = await generateResponse(true, 'Share Holding Pattern More Than 1% fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > shareHoldingPatternMoreThan1 :Share Holding Pattern More Than 1% fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > shareHoldingPatternMoreThan1 : Failed to fetch Share Holding Pattern More Than 1%`);
                        return await generateResponse(false, 'Failed to fetch Share Holding Pattern More Than 1%');
                    }

                } catch (error) {
                    this.logger.error(`Error : Share Holding Pattern More Than 1% : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        yearlyResults: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/yearlyResults/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > yearlyResults : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > yearlyResults : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Yearly-Results/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));
                        await insertMany(this.db['yearlyResults'], enrichedData,
                        );

                        const resp = await generateResponse(true, 'Yearly Results fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > yearlyResults :Yearly Results fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > yearlyResults : Failed to fetch Yearly Results`);
                        return await generateResponse(false, 'Failed to fetch Yearly Results');
                    }

                } catch (error) {
                    this.logger.error(`Error : Yearly Results : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        resultBalanceSheetQuarterly: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/resultBalanceSheetQuarterly/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > resultBalanceSheetQuarterly : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > resultBalanceSheetQuarterly : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ResultBalancesheetQuarterly/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));
                        await insertMany(this.db['resultBalanceSheetQuarterly'], enrichedData,
                        );

                        const resp = await generateResponse(true, ' Result Balance Sheet Quaterly fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > resultBalanceSheetQuarterly : Result Balance Sheet Quaterly fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > resultBalanceSheetQuarterly : Failed to fetch  Result Balance Sheet Quaterly`);
                        return await generateResponse(false, 'Failed to fetch  Result Balance Sheet Quaterly');
                    }

                } catch (error) {
                    this.logger.error(`Error : Result Balance Sheet Quaterly : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        resultBalanceSheetHalfYearly: {
            auth: 'required',
            rest: {
                method: "GET",
                path: "/resultBalanceSheetHalfYearly/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > resultBalanceSheetHalfYearly : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > resultBalanceSheetHalfYearly : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ResultBalancesheetHalfyearly/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));
                        await insertMany(this.db['resultBalanceSheetHalfYearly'], enrichedData,
                        );

                        const resp = await generateResponse(true, ' Result Balance Sheet Half Yearly fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > resultBalanceSheetHalfYearly : Result Balance Sheet Half Yearly fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > resultBalanceSheetHalfYearly : Failed to fetch  Result Balance Sheet Half Yearly`);
                        return await generateResponse(false, 'Failed to fetch  Result Balance Sheet Half Yearly');
                    }

                } catch (error) {
                    this.logger.error(`Error : Result Balance Sheet Half Yearly : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

        },

        resultBalanceSheetYearly: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/resultBalanceSheetYearly/:cocode/:type"
            },
            async handler(ctx) {
                try {
                    const { cocode, type } = ctx.params.params

                    this.logger.info(`financial5Year > resultBalanceSheetYearly : Service Starting`);

                    const validate = await quarterlyResultsValidation.validate(ctx.params)
                    if (validate.error) {
                        this.logger.info(`financial5Year > resultBalanceSheetYearly : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ResultBalancesheetyearly/${cocode}/${type}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data.success === true) {
                        const enrichedData = response.data.data.map(item => ({
                            ...item,
                            type: type,
                            cocode: cocode,
                        }));
                        await insertMany(this.db['resultBalanceSheetYearly'], enrichedData,
                        );

                        const resp = await generateResponse(true, ' Result Balance Sheet Yearly fetched successfully', enrichedData);
                        this.logger.info(`financial5Year > resultBalanceSheetYearly : Result Balance Sheet fetched successfully`);
                        return resp;
                    }
                    else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`financial5Year > resultBalanceSheetYearly : Failed to fetch  Result Balance Sheet Yearly`);
                        return await generateResponse(false, 'Failed to fetch  Result Balance Sheet Half Yearly');
                    }

                } catch (error) {
                    this.logger.error(`Error : Result Balance Sheet Yearly : ${JSON.stringify(error)}`, error);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error)
                }
            },

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



