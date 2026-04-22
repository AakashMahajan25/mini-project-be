"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, insertMany } = require("../utils/postgresUtils");
const { generateResponse, generateOtp, EmailConfig } = require("../utils/utility.js");
const { newsDetailsValidation } = require('../validation/newsValidation');
const { fetchReferenceNews } = require('../utils/polygonHelper')
const fetch = require('node-fetch');
const { default: axios } = require('axios');
const { sectorWiseCompanyValidation, indexwiseCompanyMasterValidation,  exchangeValidation, companyCodeValidation } = require("../validation/cmostsMasterValidation.js")
require('dotenv').config();


/** @type {ServiceSchema} */
module.exports = {
    name: "cmotsMaster",
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
        getGroupMaster: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getGroupMaster"
            },
            async handler(ctx) {
                const { exchange } = ctx.params.query
                try {
                    this.logger.info(`cmotsMaster > getGroupMaster : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = exchangeValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getGroupMaster: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/GroupMaster/${exchange}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
                        },
                    });

                    if (response.data.success === true) {
                        const dataWithExchange = response?.data?.data?.map(item => ({ ...item, exchange }));
                        await insertMany(this.db['groupMaster'], dataWithExchange);
                        return generateResponse(true, 'cmotsMaster Master Added  successfully', dataWithExchange);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No cmotsMaster Master Found');
                    }
                } catch (error) {
                    this.logger.info(`cmotsMaster > getGroupMaster : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getSectorMaster: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSectorMaster"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`cmotsMaster > getSectorMaster : Service Starting`);

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/SectorList`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['sectorMaster'], response?.data?.data);
                        return generateResponse(true, 'cmotsMaster Master Added  successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No cmotsMaster Master Found');
                    }

                } catch (error) {
                    this.logger.info(`cmotsMaster > getSectorMaster : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        indexMaster: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getindexMaster"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`cmotsMaster > indexMaster : Service Starting`);

                    const token = process.env.TOKEN;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/IndexList`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['indexMaster'], response?.data?.data);
                        return generateResponse(true, 'indexMaster Added successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No indexMaster  Found');
                    }

                } catch (error) {
                    console.log(error);
                    this.logger.info(`cmotsMaster > getindexMaster : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getIndexwiseCompanyMaster: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getIndexwiseCompanyMaster"
            },
            async handler(ctx) {
                const { indexCode } = ctx.params.query
                try {
                    this.logger.info(`cmotsMaster > getIndexwiseCompanyMaster : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = indexwiseCompanyMasterValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getSectorWiseCompany: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/IndexWiseComp/${indexCode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response?.data && response?.data?.success === true) {
                        const dataIndexCode = response?.data?.data.map(item => ({ ...item, indexCode }));
                        await insertMany(this.db['indexwiseCompanyMaster'], dataIndexCode);
                        return generateResponse(true, 'Indexwise Company Master Added successfully', response?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Indexwise Company Master Found');
                    }
                    

                } catch (error) {
                    console.log('error', error)
                    this.logger.info(`cmotsMaster > getIndexwiseCompanyMaster : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getExchangeHoliday: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getExchangeHoliday"
            },
            async handler(ctx) {
                const { exchange } = ctx.params.query
                try {
                    this.logger.info(`cmotsMaster > getExchangeHoliday : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = exchangeValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getExachangeHoliday: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/ExchangeHolidays/${exchange}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        const dataWithExchange = response?.data?.data?.map(item => ({ ...item, exchange }));
                        await insertMany(this.db['exchangeHoliday'], dataWithExchange);
                        return generateResponse(true, 'Exchange holidays Added   successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No exchange holidays found');
                    }

                } catch (error) {
                    this.logger.error(`cmotsMaster > getExchangeHoliday : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, please try again');
                }
            }
        },
        getExchangeInformation: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getExchangeInformation"
            },
            async handler(ctx) {
                const { cocode } = ctx.params.query
                try {
                    this.logger.info(`cmotsMaster > getExchangeInformation : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = companyCodeValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getExchangeInformation: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Company-Listing-Exchange-Information/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        const dataWithCode = response?.data?.data?.map(item => ({ ...item, cocode }));
                        await insertMany(this.db['exchangeInformation'], dataWithCode);
                        return generateResponse(true, 'Exchange information Added    successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No exchange information found');
                    }

                } catch (error) {
                    this.logger.error(`cmotsMaster > getExchangeInformation : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, please try again');
                }
            }
        },
        getRegisterDetail: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getRegisterDetail"
            },
            async handler(ctx) {
                const { cocode } = ctx.params.query
                try {
                    this.logger.info(`cmotsMaster > getRegisterDetail : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = companyCodeValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getRegisterDetail: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Registrar-Details/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        const dataWithcocode = response?.data?.data?.map(item => ({ ...item, cocode }));
                        await insertMany(this.db['registerDetail'], dataWithcocode);
                        return generateResponse(true, 'Register details Added    successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No register details found');
                    }

                } catch (error) {
                    this.logger.error(`cmotsMaster > getRegisterDetail : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, please try again');
                }
            }
        },
        getTodayResults: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getTodayResults"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`cmotsMaster > getTodayResults : Service Starting`);

                    const token = process.env.TOKEN;

                    const response = await axios.get("http://airrchipapis.cmots.com/api/Today-Results", {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    if (response.data.success === true) {
                        await insertMany(this.db['todayResults'], response?.data?.data);
                        return generateResponse(true, 'Today\'s results Added    successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No today\'s results found');
                    }

                } catch (error) {
                    this.logger.error(`cmotsMaster > getTodayResults : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, please try again');
                }
            }
        },
        getSectorWiseCompany: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSectorWiseCompany"
            },
            async handler(ctx) {
                const { sectorCode } = ctx.params.query

                try {
                    this.logger.info(`cmotsMaster > getSectorWiseCompany : Service Starting`);

                    const token = process.env.TOKEN;
                    const validate = sectorWiseCompanyValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`cmotsMaster >  getSectorWiseCompany: Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/SectorWiseComp/${sectorCode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    console.log(response)

                    if (response.data.success === true) {
                        const dataWithSectorCode = response?.data?.data?.map(item => ({ ...item, sectorCode }));
                        await insertMany(this.db['SectorWiseCompany'], dataWithSectorCode);
                        return generateResponse(true, 'Listing exchange information Added    successfully', response?.data?.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No listing exchange information found');
                    }

                } catch (error) {
                    console.log(error)
                    this.logger.error(`cmotsMaster > getSectorWiseCompany : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, please try again');
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