"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const DbService = require("../mixins/db.mixin");
const { insertMany } = require('../utils/postgresUtils');
const { generateResponse } = require('../utils/utility');
const { financialRatiosGeneralValidation } = require('../validation/financialRatiosValidation');
const { default: axios } = require('axios');

/** @type {ServiceSchema} */
module.exports = {
	name: "financialRatios",
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
		getMarginRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getMarginRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getMarginRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getMarginRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/MarginRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['margin_ratios'], modifiedData);
                        return generateResponse(true, 'Margin Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getMarginRatios : No Margin Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Margin Ratios Found');
                    }
 
                } catch (error) {
                    this.logger.info(`financialRatios > getMarginRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

		getPerformanceRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPerformanceRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getPerformanceRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getPerformanceRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/PerformanceRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['performance_ratios'], modifiedData);
                        return generateResponse(true, 'Performance Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getPerformanceRatios : No Performance Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Performance Ratios Found');
                    }
 
                } catch (error) {
                    this.logger.info(`financialRatios > getPerformanceRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

		getEfficiencyRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getEfficiencyRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getEfficiencyRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getEfficiencyRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/EfficiencyRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['efficiency_ratios'], modifiedData);
                        return generateResponse(true, 'Efficiency Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getEfficiencyRatios : No Efficiency Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Efficiency Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getEfficiencyRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

		getFinancialStabilityRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getFinancialStabilityRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getFinancialStabilityRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getFinancialStabilityRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/FinancialStabilityRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['financial_stability_ratios'], modifiedData);
                        return generateResponse(true, 'Financial Stability Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getFinancialStabilityRatios : No Financial Stability Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Financial Stability Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getFinancialStabilityRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

		getValuationRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getValuationRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getValuationRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getValuationRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ValuationRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['valuation_ratios'], modifiedData);
                        return generateResponse(true, 'Valuation Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getValuationRatios : No Valuation Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Valuation Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getValuationRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getCashFlowRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getCashFlowRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getCashFlowRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getCashFlowRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/CashFlowRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const dataToInsert = response?.data?.data.map(item => ({ ...item, type }));
						await insertMany(this.db['cashflow_ratios'], dataToInsert);
                        return generateResponse(true, 'Cashflow Ratios Fetched successfully', response.data.data);
                    }else{
						this.logger.info(`financialRatios > getCashFlowRatios : No Cashflow Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Cashflow Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getCashFlowRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getLiquidityRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getLiquidityRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getLiquidityRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getLiquidityRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/LiquidityRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['liquidity_ratios'], modifiedData);
                        return generateResponse(true, 'Liquidity Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getLiquidityRatios : No Liquidity Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Liquidity Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getLiquidityRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getDailyRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getDailyRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getDailyRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getDailyRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/DailyRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['daily_ratios'], modifiedData);
                        return generateResponse(true, 'Daily Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getDailyRatios : No Daily Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Daily Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getDailyRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getReturnRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getReturnRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getReturnRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getReturnRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/RatiosReturn/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['return_ratios'], modifiedData);
                        return generateResponse(true, 'Return Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getReturnRatios : No Return Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Return Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getReturnRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getSolvencyRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSolvencyRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getSolvencyRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getSolvencyRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/RatiosSolvency/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['solvency_ratios'], modifiedData);
                        return generateResponse(true, 'Solvency Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getSolvencyRatios : No Solvency Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Solvency Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getSolvencyRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getGrowthRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getGrowthRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getGrowthRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getGrowthRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/GrowthRatio/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['growth_ratios'], modifiedData);
                        return generateResponse(true, 'Growth Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getGrowthRatios : No Growth Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Growth Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getGrowthRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getQuaterlyRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getQuaterlyRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getQuaterlyRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getQuaterlyRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/QuarterlyRatio/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['quaterly_ratios'], modifiedData);
                        return generateResponse(true, 'Quaterly Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getQuaterlyRatios : No Quaterly Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Quaterly Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getQuaterlyRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getYearlyRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getYearlyRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getYearlyRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getYearlyRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/YearlyRatio/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                co_code: data.CO_CODE,
                                YRC: data?.YearEnd,
                                type
                            })
                        }
						await insertMany(this.db['yearly_ratios'], modifiedData);
                        return generateResponse(true, 'Yearly Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getYearlyRatios : No Yearly Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Yearly Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getYearlyRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getYearlyResultBasedRatios: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getYearlyResultBasedRatios"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`financialRatios > getYearlyResultBasedRatios : Service Starting `);

					const validate = await financialRatiosGeneralValidation.validate(ctx.params);

                    if (validate.error) {
                        this.logger.info(`financialRatios > getYearlyResultBasedRatios : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

					const { companyCode, type } = ctx.params.query;
					
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/YearlyResultBasedRatios/${companyCode}/${type}`, {
						headers: {
							'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });
					
                    if(response.data.data && response.data.success === true){
                        const modifiedData = []
                        for (const data of response.data.data) {
                            modifiedData.push({...data,
                                type
                            })
                        }
						await insertMany(this.db['yearly_result_based_ratios'], modifiedData);
                        return generateResponse(true, 'Yearly Result Based Ratios Fetched successfully', modifiedData);
                    }else{
						this.logger.info(`financialRatios > getYearlyResultBasedRatios : No Yearly Result Based Ratios Found `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Yearly Result Based Ratios Found');
                    }
                } catch (error) {
                    this.logger.info(`financialRatios > getYearlyResultBasedRatios : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
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
