"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin.js");
const { create, findOne, updateRecords, findAll, findAndCountAll, rawQuery, insertMany } = require("../utils/postgresUtils.js");
const { generateResponse } = require("../utils/utility.js");
const { default: axios } = require('axios');
require('dotenv').config();
const { Sequelize } = require("sequelize");
const { cocodeValidation, fetchNameChangeValidation, eventCountValidation, eventDetailsValidation, eventDetailsMonthlyValidation, eventCountDateWiseValidation } = require('../validation/corporateAnnouncementValidation.js')
/** @type {ServiceSchema} */
module.exports = {
    name: "corporateAnnouncement",
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
        
        fetchBSEAnnouncements: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchBSEAnnouncements"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchBSEAnnouncements : Service Starting`);

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BSEAnnouncement`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['bse_announcements'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchBSEAnnouncements : BSE announcements fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'BSE announcements fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchBSEAnnouncements : No BSE announcements Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No BSE announcements Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchBSEAnnouncements : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchNSEAnnouncements: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchNSEAnnouncements"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchNSEAnnouncements : Service Starting`);

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/NSEAnnouncement`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['nse_announcements'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchNSEAnnouncements : NSE announcements fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'NSE announcements fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchNSEAnnouncements : No NSE Announcements Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No NSE Announcements Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchNSEAnnouncements : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchBookCloser: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchBookCloser"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchBookCloser : Service Starting`);
                    
                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchBookCloser : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BookCloser/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['book_closer'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchBookCloser : Book Closer Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'Book Closer Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchBookCloser : No Book Closer Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Book Closer Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchBookCloser : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        boardMeetings: {
            auth: true,
            rest: {
                method: "GET",
                path: "/boardMeetings"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > boardMeetings : Service Starting`);
                    
                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > boardMeetings : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BoardMeetings/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['board_meetings'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > boardMeetings : Board Meetings Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'Board Meetings Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > boardMeetings : No Board Meetings Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'No Board Meetings Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > boardMeetings : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchBonusIssues: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchBonusIssues"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchBonusIssues : Service Starting`);
                    
                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchBonusIssues : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BonusIssues/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['bonus_issues'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchBonusIssues : Bonus Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'Bonus Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchBonusIssues : No Bonus Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Bonus Not Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchBonusIssues : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchRightIssues: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchRightIssues"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchRightIssues : Service Starting`);
                    
                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchRightIssues : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/RightIssues/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['right_issues'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchRightIssues : Right Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'Right Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchRightIssues : No Right Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Right Not Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchRightIssues : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
    
        fetchDeListed: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchDeListed"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchDeListed : Service Starting`);

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/DeListed`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['delisted'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchDeListed : DeListed Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'DeListed Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchDeListed : No DeListed Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Right Not Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchDeListed : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchAGMData: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchAGMData"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchAGMData : Service Starting`);

                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchAGMData : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/AGM/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['agm'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchAGMData : AGM Data Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'AGM Data Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchAGMData : No AGM Data Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'AGM Not Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchAGMData : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchEGMData: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchEGMData"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchEGMData : Service Starting`);

                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchEGMData : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;

                    const response = await axios.get(`http://airrchipapis.cmots.com/api/AGM/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['egm'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchEGMData : EGM Data Fetched Successfully : ${insertedData}`);
                        return generateResponse(true, 'EGM Data Fetched Successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchEGMData : EGM Data Not Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'EGM Data Not Found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchEGMData : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        fetchChangeOfName: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchChangeOfName"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchChangeOfName : Service Starting`);

                    const validationResult = fetchNameChangeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchChangeOfName : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { alpha } =  ctx.params.query;
                    let basrUrl = 'http://airrchipapis.cmots.com/api/ChangeOfName/all';
                    if(alpha){
                        basrUrl += `?alpha=${alpha}`
                    }
                    const response = await axios.get(basrUrl, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['name_change'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchChangeOfName : Name change data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Name change data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchChangeOfName : Name change Not Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Name change data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchChangeOfName : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        fetchFaceValueSplits: {
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchFaceValueSplits"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchFaceValueSplits : Service Starting`);

                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchFaceValueSplits : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Split-of-FaceValue/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['splits'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchFaceValueSplits : Name change data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Face value splits data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchFaceValueSplits : Name change Not Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, response?.data?.message || 'Face value splits data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchFaceValueSplits : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        // fetch company Merger/Demerger details based on co_code(company code)
        fetchCompanyMergerDemerger:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchCompanyMergerDemerger"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchCompanyMergerDemerger : Service Starting`);

                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchCompanyMergerDemerger : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/MergerDemerger/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['company_merger'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchCompanyMergerDemerger : Company Merger/Demerger data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Company Merger/Demerger data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchCompanyMergerDemerger : Company Merger/Demerger Not Found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Company Merger/Demerger data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchCompanyMergerDemerger : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        // fetch company Buy Back details based on co_code(company code)
        fetchBuyBackDetaills:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchBuyBackDetaills"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchBuyBack : Service Starting`);

                    const validationResult = cocodeValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchBuyBack : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { cocode } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/BuyBack/${cocode}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['company_buyback'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchBuyBack : Company buy back data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Company buy back data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchBuyBack : Company buy back not found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Company buy back data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchBuyBack : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        
        // fetch MonthYear wise event count Month-Year-Wise-Count/jan2022
        fetchMonthYearWiseEventCount:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchMonthYearWiseEventCount"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchMonthYearWiseEventCount : Service Starting`);

                    const validationResult = eventCountValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchMonthYearWiseEventCount : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { month, year } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Month-Year-Wise-Count/${month}${year}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        let resData = response.data.data;
                        // Iterate over each object in the array and rename the property
                        const returnData = await Promise.all(resData.map(async (item) => {
                            item.totalcount = item.TotalCount;
                            delete item.TotalCount;
                            return item;
                        }));
                        const insertedData = await insertMany(this.db['event_counts'], returnData, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchMonthYearWiseEventCount : Event count data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Event count data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchMonthYearWiseEventCount : Event count not found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Event count data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchMonthYearWiseEventCount : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        // fetch Event date wise details Eventdatewisedetails/22-Sep-2021/BookCloser/11
        fetchEventDetailsByDate:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchEventDetailsByDate"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchEventDetailsByDate : Service Starting`);

                    const validationResult = eventDetailsValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchEventDetailsByDate : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { date, corpType, fetchRecordCount } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Eventdatewisedetails/${date}/${corpType}/${fetchRecordCount}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && Array.isArray(response.data.data) && response.data.data.length > 0){
                        const resData = response.data.data;
                        resData.forEach(res => {
                            res.corp_type = corpType;
                        });
                        const insertedData = await insertMany(this.db['event_details'], resData, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchEventDetailsByDate : Event details fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Event details fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchEventDetailsByDate : Event count not found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, (response.data.data)?response.data.data:'Event details not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchEventDetailsByDate : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        // fetch Event this Week and this month wise details  corp-action-WKMonth-details/mon/BookCloser/10
        fetchCurrentMonthEventDetails:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchCurrentMonthEventDetails"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchCurrentMonthEventDetails : Service Starting`);

                    const validationResult = eventDetailsMonthlyValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchCurrentMonthEventDetails : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { corpType, limit } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/corp-action-WKMonth-details/mon/${corpType}/${limit}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && Array.isArray(response.data.data) && response.data.data.length > 0){
                        const resData = response.data.data;
                        resData.forEach(res => {
                            res.corp_type = corpType;
                        });
                        const insertedData = await insertMany(this.db['event_details'], resData, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchCurrentMonthEventDetails : Monthly Event details fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Event details fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchCurrentMonthEventDetails : Monthly Event details found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, (response.data.data)?response.data.data:'Event details not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchCurrentMonthEventDetails : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        // fetch Event date wise count Eventdatewisecount/13-may-2022
        fetchEventCountDateWise:{
            auth: true,
            rest: {
                method: "GET",
                path: "/fetchEventCountDateWise"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`corporateAnnouncement > fetchEventCountDateWise : Service Starting`);

                    const validationResult = eventCountDateWiseValidation.validate(ctx.params);
                    if (validationResult.error) {
                        this.logger.info(`corporateAnnouncement > fetchEventCountDateWise : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const { date } =  ctx.params.query;
                
                    const response = await axios.get(`http://airrchipapis.cmots.com/api/Eventdatewisecount/${date}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.TOKEN}` // Add the token to the Authorization header
                        },
                    });

                    if(response.data.success === true && response.data.data){
                        const insertedData = await insertMany(this.db['event_counts'], response.data.data, { ignoreDuplicates: true});
                        this.logger.info(`corporateAnnouncement > fetchEventCountDateWise : Event count data fetched successfully : ${insertedData}`);
                        return generateResponse(true, 'Event count data fetched successfully', insertedData);
                    }else{
                        this.logger.info(`corporateAnnouncement > fetchEventCountDateWise : Event count not found`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Event count data not found');
                    }
 
                } catch (error) {
                    this.logger.info(`corporateAnnouncement > fetchEventCountDateWise : Internal Server Error : ${error}`);
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
