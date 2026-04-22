"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne,updateRecords, findAll, rawQuery, deleteManyRecord, bulkInsertData, findAndCountAll, insertMany } = require("../utils/postgresUtils");
const { generateResponse, generateOtp, EmailConfig, userTokens, checkEmailGenuineness } = require("../utils/utility.js");
const { sendMobileOTP } = require("../utils/azureHelper");
const { userSignUpValidation, userUpdateValidation, generateOtpValidation, verifyOtpValidation, fetchUserValidation, addUserTopicsValidation, eventIdValidation, fetchAllDetailsBasedOnCompanyValidation, generateAdminOtpValidation, resendOtpValidation, userFeedbackValidation, emailLoginOtpValidation, emailLoginVerifyOtpValidation } = require("../validation/userValidation");
const moment = require("moment");
const Nodemailer = require('nodemailer');
const { Sequelize, Op, literal, where } = require("sequelize");
require('dotenv').config();
const md5 = require('md5');
const jwt 			= require("jsonwebtoken");
const axios  = require('axios');
const { verificationTemplate, welcomeTemplate } = require('../utils/emailTemplates.js');
// AWS S3 commented out for nodemailer-only setup
// const AWS = require("aws-sdk");

// const S3Bucket = new AWS.S3({
//     signatureVersion: 'v4',
//     params: { Bucket: process.env.AWS_BUCKET_NAME },
// });

// Stub for S3Bucket for nodemailer-only setup
const S3Bucket = {
    getSignedUrlPromise: async (operation, params) => {
        console.log('AWS S3 disabled - returning dummy URL');
        return 'https://example.com/dummy-file-url';
    }
};

/** @type {ServiceSchema} */
module.exports = {
    name: "users",
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
            auth: "required",
            rest: {
                method: "GET",
                path: "/",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`user > fetchUserList : Service Starting `);
                    let projection = {};
                    if(ctx.params.query && ctx.params.query.limit){
                        projection.limit= ctx.params.query.limit;
                        projection.offset= ctx.params.query.offset?ctx.params.query.offset:0;
                    }
                   
                    // const response = await findAll(this.db['users'], { isActive: true },projection);
                    const response = await rawQuery(this.db['sequelize'], `SELECT u.*,ud.*, p.*
                    FROM users u
                    LEFT JOIN user_details ud ON u."user_id" = ud."user_id"
                    LEFT JOIN plans p  ON u."plan_id" = p."plan_id"
                    LIMIT 10 -- Limit the number of results per page
                    OFFSET 0; -- Offset for the current page (page 1)`);

                    if (response) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`user > listOfAllUsers : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.info(`user > listOfAllUsers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: error };
                }
            }
        },
        userDetails: {
            auth: "required",
            rest: {
                method: "GET",
                path: "userDetails",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`user > fetchUserList : Service Starting `);
                    // const validate = fetchUserValidation.validate(ctx.params);
					// if (validate.error) {
                    //     this.logger.info(`User > getUserDetailsByUserId : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
					// 	ctx.meta.$statusCode = 400;
					// 	return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
					// }
                    const { user_id } = ctx.meta.user;
                    // const response = await findOne(this.db['users'], { user_id:userId, isActive: true });
                    const response = await rawQuery(this.db['sequelize'], `SELECT u.*, ud.*
                    FROM users u 
                    LEFT JOIN user_details ud ON u."user_id" = ud."user_id"
                    WHERE u."user_id" = ${user_id} AND u."isActive" = 'true'`);

                    if (response && response.length > 0) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response[0]);
                        this.logger.info(`user > getUserDetailsByUserId : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, `User not found with user id ${userId}`);
                    }
                } catch (error) {
                    this.logger.info(`user > listOfAllUsers : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        signup: {
            rest: {
                method: "POST",
                path: "/signup",
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`User > signup : Service Starting`);
                    const { first_name, last_name, email, phone_number, country, broker } = ctx.params.body;
                    const validation = userSignUpValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`User > signup : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    // For email-only signup, check if user exists with email and emailVerified is true
                    const user = await findOne(this.db['users'], { email: email });

                    if (typeof user !== 'undefined' && user.emailVerified === true) {
                        // User Strong Password Process
                        // const userRegister = await create(this.db['users'], { email, username: '', password_hash: '' }, transaction);
                        // if (userRegister) {
                            const user_details = {
                                user_id: user.user_id,
                                first_name: first_name,
                                last_name: last_name,
                                country: country || "",
                                date_of_birth: "",
                                address: "",
                                profile_picture: "",
                                broker: broker || ""
                            }
                            const userResp = await updateRecords(this.db['users'], {isActive : true},{user_id : user.user_id} ,transaction);

                            const userDetails = await create(this.db['user_details'], user_details, transaction);
                            if (!userDetails || !userResp['recordsUpdated']) {
                                await transaction.rollback();
                                this.logger.error(`User > signup' Not Stored' `);
                                ctx.meta.$statusCode = 400;
                                const resp = generateResponse(false, 'Error', 'Unable to signup');
                                return resp;
                            }

                            const freePlan = await findOne(this.db['plans'], { subsciption_type: "free", isActive: true })

                            if (freePlan) {
                                let requestData = {};
                                requestData.expiry_date = '2099-01-01';
                                requestData.plan_price = freePlan.price;
                                requestData.credits_used = 0;
                                requestData.credit_at_purchase = freePlan.credits_offered;
                                await create(this.db['user_plans'], { user_id: user.user_id, plan_id: freePlan.plan_id, ...requestData }, transaction);
                            }

                            // Set cognitoId to null for email-only authentication
                            await updateRecords(this.db['user_details'], { cognitoId: null }, { user_id: user.user_id }, transaction);

                            let mailOptions = {
                                from: EmailConfig.auth.user,
                                to: email,
                                subject: "Welcome",
                                attachments: [
                                   {
                                       filename: 'welcomeImage.png',
                                       path: './uploads/welcomeImage.png',
                                       cid: 'welcome'
                                   },
                               ],
                               html: welcomeTemplate(),
                            };
    
                            const transporter = Nodemailer.createTransport(EmailConfig);
    
                            let error = null;
    
                            await transporter.sendMail(mailOptions).catch(async (err) => {
                                error = err.message;
                            });

                            transaction.commit();
                            const resp = generateResponse(true, 'Signup successfully done', userDetails, true);
                            this.logger.info(`User > signup : Signup successfully done `);
                            return resp;
                        // } 
                        // else {
                        //     await transaction.rollback();
                        //     this.logger.error(`User > signup' Not Stored' :  ${JSON.stringify(userRegister)}`);
                        //     ctx.meta.$statusCode = 400;
                        //     const resp = generateResponse(false, 'Unable to signup');
                        //     return resp;
                        // }
                    } else {
                        const message = (!user || !user.emailVerified) ? 'Please verify your email' : 'Please complete verification process';
                            
                        this.logger.info(`User > signup : Error in signup : ${message}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, message);
                    }
                } catch (error) {
                    await transaction.rollback();
                    this.logger.info(`User > signup : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        sendSignUpOtp: {
            rest: {
                method: "POST",
                path: "/sendSignUpOtp"
            },
            async handler(ctx) {
                if (!this.db || !this.db.sequelize) {
                    ctx.meta.$statusCode = 503;
                    return generateResponse(false, 'Database connection not available');
                }
                const transaction = await this.db.sequelize.transaction();
                let isTransactionFinished = false;
                try {
                    this.logger.info(`Signup > sendOtp : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = await generateOtpValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`Signup > sendOtp : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        await transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { email } = ctx.params?.body;
                    const expiry_date = moment().utc().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

                    // Check email genuineness using Debounce.io API
                    const isEmailGenuine = await checkEmailGenuineness(email);
                    if (!isEmailGenuine) {
                        this.logger.info(`Signup > sendOtp : Email is disposable/not genuine: ${email}`);
                        await transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Please use a valid email address');
                    }

                    // Check if user already exists and is verified
                    const userEmailExist = await findOne(this.db['users'], { email: email, isActive : true });
                    if (userEmailExist && userEmailExist.emailVerified) {
                        this.logger.info(`Signup > generateOtp : user already exist `);
                        await transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User with Email already exists`);
                    }
                    
                    const otp = await generateOtp(6);
                    let mailOptions = {
                        from: EmailConfig.auth.user,
                        to: email,
                        subject: "OTP for signup",
                        attachments: [
                           {
                               filename: 'VerificationImage.png',
                               path: './uploads/VerificationImage.png',
                               cid: 'verify'
                           },
                       ],
                       html: verificationTemplate(otp),
                    };

                    const transporter = Nodemailer.createTransport(EmailConfig);
                    let error = null;

                    const response = await transporter.sendMail(mailOptions).catch(async (err) => {
                        await transaction.rollback();
                        isTransactionFinished = true;
                        error = err.message;
                        this.logger.error(`OTP > SEND : Failed to sent otp - Error: ${JSON.stringify(err)}`);
                        console.error('Email sending error:', err);
                        return null;
                    });

                    if (response !== null && error === null) {
                        const emaildata = {
                            expireTime: expiry_date,
                            type: 'email',
                            otp: md5(otp),
                            emailId: email,
                        }
                        await create(this.db['otp'], emaildata, transaction);
                        const resp = await generateResponse(true, 'OTP Email has sent successfully');
                        this.logger.info(`OTP > SEND : OTP Email has sent successfully`);
                        await transaction.commit();
                        isTransactionFinished = true;
                        return resp;
                    } else {
                        if (!isTransactionFinished) {
                            await transaction.rollback();
                        }
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`OTP > SEND : Failed to sent otp`);
                        return await generateResponse(false,  'Failed to sent OTP');
                    }
                } catch (error) {
                    // Only rollback if transaction hasn't been finished yet
                    if (!isTransactionFinished) {
                        await transaction.rollback();
                    }
                    this.logger.error(`Error : Signup > Server-Error : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        adminEmailOTP: {
            rest: {
                method: "POST",
                path: "/adminEmailOTP"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`Signup > sendOtp : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = await generateAdminOtpValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`Signup > sendOtp : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { email } = ctx.params?.body
                     const userExist = await findOne(this.db['users'], { email, isActive: true });;
                    if (!userExist) {
                        this.logger.info(`Signup > generateOtp : user already exist `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User with Email not exists`);
                    }

                        const response =  await this.sendOTPMethod('email', email,'', '', '');
                        if (response) {
                            const resp = await generateResponse(true, 'OTP has sent successfully',userExist);
                            this.logger.info(`OTP > SEND : Otp has sent successfully`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 400;
                            this.logger.info(`OTP > SEND : Failed to sent otp`);
                            return await generateResponse(false, 'OTP', 'Failed to sent OTP');
                        }
                  
                } catch (error) {
                    await transaction.rollback();
                    this.logger.error(`Error : Signup > Server-Error : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        verifyOtp: {
            rest: {
                method: "POST",
                path: "/verifyOtp",
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`user > verifyOtp : Service Starting ${JSON.stringify(ctx.params.body)}`);
                    const validation = verifyOtpValidation.validate(ctx.params || {});
                    if (validation.error) {
                        await t.rollback();
                        this.logger.info(`user > verifyOtp : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { email, otp } = ctx.params.body;
                    
                    // Check if user already exists (inactive)
                    const existUser = await findOne(this.db['users'], { email: email, isActive : false });

                    // Verify OTP for email
                    const response = await this.verifyOtp('email', null, email, otp, t);

                    if(response.status === true) {
                        if(!existUser) {
                            await create(this.db['users'], { email, emailVerified: true });
                        } else {
                            await updateRecords(this.db['users'], { email, emailVerified: true }, {email: email});
                        }
                    }
                    
                    if (!response.status) {
                        this.logger.info(`User > verifyLoginMobileNo : Unable to verify otp`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, ' Unable to verify OTP');
                    }
                    await t.commit();
                    return generateResponse(true,  'OTP Verified');

                    // if (type === 'mobile') {
                    //     const response = await axios({
                    //         method: 'get',
                    //         url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY_FRRUIT}/SMS/VERIFY3/${mobile}/${otp}`,
                    //         headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    //     })
                    //     if (response.status === 200 && response.data.Status === 'Success') {
                    //         await t.commit();
                    //         await create(this.db['users'], { phone_number: mobile, mobileVerified: true });
                    //         const resp = await generateResponse(true, 'OTP Verified');
                    //         this.logger.info(`OTP > SEND : OTP Verified`);
                    //         return resp;
                    //     } else {
                    //         await t.rollback();
                    //         this.logger.info(`OTP > verifyMobileNo : Unable to verify otp`);
                    //         ctx.meta.$statusCode = 400;
                    //         return generateResponse(false, `Unable to verify otp`);
                    //     }
                    // }
                    // else {
                    //     const response = await this.verifyOtp(type, mobile, email, otp, t);
                    //     if (response.status === true && type === 'email') {
                    //         await t.commit();
                    //         await updateRecords(this.db['users'], { email, emailVerified: true }, { phone_number: mobile });
                    //         return generateResponse(true, 'OTP', 'OTP Verified');
                    //     }
                    //     else {
                    //         await t.rollback();
                    //         this.logger.info(`User > verifyMobileNo : Unable to verify otp`);
                    //         ctx.meta.$statusCode = 400;
                    //         return generateResponse(false, 'Error', ' Unable to verify otp');
                    //     }
                    // }


                } catch (error) {
                    await t.rollback();
                    this.logger.error(`Error : employee > Server-Error : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Server-Error' || 'Something went wrong, Please try again', error)
                }
            }
        },

        // DEPRECATED: sendotp function removed for email-only authentication
        // Use emailLoginOtp instead for email-based OTP login
        /*
        sendotp: {
            rest: {
                method: "POST",
                path: "/sendotp",
            },
            async handler(ctx) {
                
                try {
                    this.logger.info(`OTP > list : Inside Handler`);
                    const body = ctx.params.body;
                    const email = body.email;
                    const mobile = body.mobile;

                    const cogRes = await verifyMobile(mobile)
                    
                    if (cogRes.UserStatus === 'CONFIRMED') {
                        const userPhoneNumber = cogRes.UserAttributes.find(attr => attr.Name === 'phone_number')?.Value;

                        if (userPhoneNumber && userPhoneNumber === mobile) {
                            if (body && body.type === 'mobile') {
                                const checkUserData = await findOne(this.db['users'], { phone_number: mobile, isActive : true });
                                if (checkUserData) {

                                     //comment this part if otp is coming from 2 factor
                                     
                                    const isSendMobileOtp = await this.sendOTPMethod('mobile', body.mobile,'', '', '');
                                    if (isSendMobileOtp) {
                                        const resp = await generateResponse(true, 'OTP has sent successfully');
                                        this.logger.info(`OTP > SEND : OTP has sent successfully`);
                                        return resp;
                                    } else {
                                        this.logger.info(`OTP > generateOtp : Error in sending OTP, Please try again`);
                                        return generateResponse(false, `Error in sending OTP, Please try again`);
                                    }
                                    // const response = await axios({
                                    //     method: 'get',
                                    //     url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY_FRRUIT}/SMS/${mobile}/AUTOGEN2/FrruitOTP Login`,
                                    //     headers: { 'content-type': 'application/x-www-form-urlencoded' }
                                    // });
                                    // // const isSendMobileOtp = await this.sendOTPMethod('mobile', body.mobile,'', '', '');
                                    // if (response.status === 200 && response.data.Status === 'Success') {
                                    //     const resp = await generateResponse(true, 'Otp has sent successfully');
                                    //     this.logger.info(`OTP > SEND : Otp has sent successfully`);
                                    //     console.log('login otp sent', resp)
                                    //     return resp;
                                    // } else {
                                    //     this.logger.info(`OTP > generateOtp : Error in sending OTP, Please try again`);
                                    //     ctx.meta.$statusCode = 400;
                                    //     return generateResponse(false, `Error in sending OTP, Please try again`);
                                    // }
                                } else {
                                    ctx.meta.$statusCode = 404;
                                    const resp = generateResponse(false, 'No Active User Found');
                                    // Need to add logger;
                                    this.logger.info(`OTP > SEND : No Active User Found`);
                                    return resp;
                                }
                            } else {
                                const checkUserEmailData = await findOne(this.db['users'], { email: email });
                                if (checkUserEmailData) {
                                    const response =  await this.sendOTPMethod('email', email,'', '', '');
                                    if (response) {
                                        const resp = await generateResponse(true, 'OTP has sent successfully');
                                        this.logger.info(`OTP > SEND : OTP has sent successfully`);
                                        return resp;
                                    } else {
                                        ctx.meta.$statusCode = 400;
                                        this.logger.info(`OTP > SEND : Failed to sent otp`);
                                        return await generateResponse(false, 'OTP', 'Failed to sent OTP');
                                    }
                                } else {
                                    ctx.meta.$statusCode = 404;
                                    const resp = generateResponse(false, 'User does not exist with this email');
                                    // Need to add logger;
                                    this.logger.info(`OTP > SEND : User does not exist with this email`);
                                    return resp;
                                }
                            }
                        } 
                    }
                     else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Mobile Number does not exist. Please create an account');
                    }
                } catch (err) {
                    this.logger.error(`Error : OTP > SEND : ${JSON.stringify(err)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse('false', err?.message || 'Something went wrong, Please try again')
                }
            }
        },
        */

        // DEPRECATED: verifyLoginMobileNo function removed for email-only authentication
        // Use emailLoginVerifyOtp instead for email-based OTP verification
        /*
        verifyLoginMobileNo: {
            rest: {
                method: "POST",
                path: "/verifyLoginMobileNo",
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`OTP > list : Inside Handler`);
                    this.logger.info(`user > verifyOtp : Service Starting ${JSON.stringify(ctx.params.body)}`);
                    const validation = verifyOtpValidation.validate(ctx.params || {});
                    if (validation.error) {
                        this.logger.info(`user > verifyOtp : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { type, mobile, email, otp } = ctx.params.body;
                    let userExist = await this.checkMobileNumber(mobile);
                    if (!userExist) {
                        this.logger.info(`user > verifyLoginMobileNo : does not exists`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User with ${type === 'mobile' ? 'Mobile number' : 'Email'} does not exists`);
                    }

                    const userDetails = await findOne(this.db['user_details'], { user_id: userExist.user_id });
                    if(!userDetails){
                        this.logger.info(`user > verifyLoginMobileNo : does not exists`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User deatils with ${type === 'mobile' ? 'Mobile number' : 'Email'} does not exists`); 
                    }
                    userExist.user_detail_id = userDetails.user_detail_id
                    userExist.cognitoId = userDetails.cognitoId
                    userExist.first_name = userDetails.first_name
                    userExist.last_name = userDetails.last_name

                     //comment this part if otp is coming from 2 factor

                    const response = await this.verifyOtp(type === 'email' ? 'email' : 'mobile', mobile, email, otp, t);

                    if (!response.status) {
                        await t.rollback();
                        this.logger.info(`User > verifyLoginMobileNo : Unable to verify otp`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, ' Unable to verify OTP');
                    }
                    
                    const resp = generateResponse(true, 'Login Sucess', userExist, true);
                    await t.commit();
                    return resp;

                    // if(type=== 'mobile'){
                    //     const response = await axios({
                    //         method: 'get',
                    //         url: `https://2factor.in/API/V1/${process.env.SMS_API_KEY_FRRUIT}/SMS/VERIFY3/${mobile}/${otp}`,
                    //         headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    //     })
                    //     if (response.status === 200 && response.data.Status === 'Success') {
                    //         const resp = await generateResponse(true, 'Login Sucess', userExist, true);
                    //         await t.commit();
                    //         this.logger.info(`OTP > Login Sucess`);
                    //         console.log('login OTP verified', resp)
                    //         return resp;
                    //     } else {
                    //         await t.rollback();
                    //         this.logger.info(`OTP > generateOtp : Unable to verify otp, Try Again`);
                    //         ctx.meta.$statusCode = 400;
                    //         return generateResponse(false, `Unable to verify otp, Try Again`);
                    //     }
                    // }else{

                    //     const response = await this.verifyOtp('email', mobile, email, otp, t);
    
                    //     if (!response.status) {
                    //         await t.rollback();
                    //         this.logger.info(`User > verifyLoginMobileNo : Unable to verify otp`);
                    //         ctx.meta.$statusCode = 400;
                    //         return generateResponse(false, ' Unable to verify otp');
                    //     }
                        
                    //     const resp = generateResponse(true, 'Login Sucess', userExist, true);
                    //     await t.commit();
                    //     return resp;
                    // }


                } catch (err) {
                    await t.rollback();
                    this.logger.error(`Error : user > verifyLoginMobileNo : ${JSON.stringify(err)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse('false', err?.message || 'Something went wrong, Please try again')
                }
            }
        },
        */

        // Email-based login - send OTP
        emailLoginOtp: {
            rest: {
                method: "POST",
                path: "/emailLoginOtp",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`Email Login > sendOtp : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validation = emailLoginOtpValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`Email Login > sendOtp : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { email } = ctx.params?.body;
                    
                    // Check if user exists and is active
                    const userExist = await findOne(this.db['users'], { email, isActive: true, emailVerified: true });
                    if (!userExist) {
                        this.logger.info(`Email Login > sendOtp : user does not exist or not verified`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User with this email does not exist or is not verified`);
                    }

                    const response = await this.sendOTPMethod('email', email, 'OTP for Login', '', '');
                    if (response) {
                        const resp = generateResponse(true, 'OTP has sent successfully');
                        this.logger.info(`Email Login > sendOtp : OTP has sent successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Email Login > sendOtp : Failed to send OTP`);
                        return generateResponse(false, 'Failed to send OTP');
                    }
                } catch (error) {
                    this.logger.error(`Error : Email Login > sendOtp : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again', error);
                }
            }
        },

        // Email-based login - verify OTP
        emailLoginVerifyOtp: {
            rest: {
                method: "POST",
                path: "/emailLoginVerifyOtp",
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`Email Login > verifyOtp : Service Starting ${JSON.stringify(ctx.params.body)}`);
                    const validation = emailLoginVerifyOtpValidation.validate(ctx.params);
                    if (validation.error) {
                        await t.rollback();
                        this.logger.info(`Email Login > verifyOtp : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { email, otp } = ctx.params.body;
                    
                    // Check if user exists
                    const userExist = await findOne(this.db['users'], { email, isActive: true, emailVerified: true });
                    if (!userExist) {
                        await t.rollback();
                        this.logger.info(`Email Login > verifyOtp : User does not exist`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User with this email does not exist`);
                    }

                    // Get user details
                    const userDetails = await findOne(this.db['user_details'], { user_id: userExist.user_id });
                    if (!userDetails) {
                        await t.rollback();
                        this.logger.info(`Email Login > verifyOtp : User details do not exist`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `User details with this email do not exist`);
                    }

                    // Verify OTP
                    const response = await this.verifyOtp('email', null, email, otp, t);
                    if (!response.status) {
                        await t.rollback();
                        this.logger.info(`Email Login > verifyOtp : Unable to verify OTP`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Unable to verify OTP');
                    }

                    // Prepare user data for response
                    userExist.user_detail_id = userDetails.user_detail_id;
                    userExist.cognitoId = userDetails.cognitoId;
                    userExist.first_name = userDetails.first_name;
                    userExist.last_name = userDetails.last_name;

                    const resp = generateResponse(true, 'Login Success', userExist, true);
                    await t.commit();
                    return resp;

                } catch (error) {
                    await t.rollback();
                    this.logger.error(`Error : Email Login > verifyOtp : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again');
                }
            }
        },

        updateProfile: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/updateProfile",
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`User > Update profile : Inside Handler`);
                    const {first_name, last_name, email, phone_number, address} = ctx.params.body
                    const { user_id, user_detail_id } = ctx.meta.user;
                    const data = {}

                    const validation = userUpdateValidation.validate(ctx.params);
                    if (validation.error) {
                        this.logger.info(`User > Update profile : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const userData = await findOne(this.db['users'], { user_id });
                    const userDetailsData = await findOne(this.db['user_details'], { user_detail_id });

                    if(phone_number) {
                        const checkPhoneNumber = await findAll(this.db['users'], { phone_number, user_id: {[Sequelize.Op.not]: user_id} } );
                        if(checkPhoneNumber?.length > 0) {
                            ctx.meta.$statusCode = 400;
                            const resp = generateResponse(true, 'User with same Phone number already exists');
						    return resp;
                        }
                    }
                    if(email) {
                        const checkEmail = await findAll(this.db['users'], { email, user_id: {[Sequelize.Op.not]: user_id} });
                        if(checkEmail?.length > 0) {
                            ctx.meta.$statusCode = 400;
                            const resp = generateResponse(true, 'User with same email already exists');
						    return resp;
                        }
                    }

                    if(first_name) data.first_name = first_name
                    if(last_name) data.last_name = last_name
                    if(address) data.address = address
                    if(phone_number) {
                        data.phone_number = phone_number
                        await updateRecords(this.db['users'], {phone_number}, { user_id });

                    }
                    if(email) {
                        data.email = email
                        await updateRecords(this.db['users'], {email}, { user_id });
                    }

                    const response = await updateRecords(this.db['user_details'], data, { user_detail_id }, t);
                    // AWS updateUserAttributes removed for email-only authentication

                    await t.commit();
					if (response['recordsUpdated']) {
						const resp = generateResponse(true, 'Success', 'User Details Updated Successfully');
						this.logger.info(`User > Update profile : User Details Updated Successfully ${JSON.stringify(data)}`);
						return resp;
					} else {
						ctx.meta.$statusCode = 400;
						return generateResponse(false, 'Failed', 'Failed to update details.');
					}

                } catch (err) {
                    await t.rollback();
                    this.logger.error(`Error : User > Update profile : ${JSON.stringify(err)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse('false', err?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getAvaliableCredit: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getAvaliableCredit",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`User > getAvaliableCredit : Service Starting ${JSON.stringify(ctx.params)}`);
                    const {user_id} = ctx.meta.user;
                    const validate = fetchUserValidation.validate({params : {
                        userId : user_id
                    }});
                    if (validate.error) {
                        this.logger.info(`User > getAvaliableCredit : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `select up.credit_at_purchase as credits, up.credits_used as usedcredits, up.expiry_date, up.plan_id from user_plans up where up.user_id = ${user_id} and up."isActive" = true`);

                    if (response) {
                        const expired = response.expiry_date ? moment(currentDate).isAfter(response.expiry_date) : false;
                        const remainingCredits = response.credits - response.usedcredits;
                        const creditsAccPlan = response.plan_id === 2 ? 5 : 20;
                        const warning = !expired && remainingCredits <= creditsAccPlan;

                        if (response.credits > 0) {
                            const values =       {
                                usedCredits : response.usedcredits,
                                totalCredits : response.credits,
                                planId : response.plan_id,
                                expired: expired
                            };
                            if (warning) {
                                values.warning = true;
                            }
                            const resp = generateResponse(true, 'Data Fetched Successfully', values);
                            this.logger.info(`user > getAvaliableCredit : Data Fetched Successfully ${JSON.stringify(values)}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            this.logger.error(`Error : User > getAvaliableCredit : 'No Credit Found'`);
                            return generateResponse(false, 'No Credit Found');
                        }                        
                    } else {
                        this.logger.error(`Error : User > getAvaliableCredit : 'Not Found'`);
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }

                } catch (error) {
                    this.logger.error(`Error : User > getAvaliableCredit : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        getAvaliableUserCredit: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getUserCredits",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`User > getUserCredits : Service Starting ${JSON.stringify(ctx.params)}`);
                    const { user_id } = ctx.params.query;
                    const validate = fetchUserValidation.validate({params : {
                        userId : user_id
                    }});
                    if (validate.error) {
                        this.logger.info(`User > getUserCredits : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const [response] = await rawQuery(this.db['sequelize'], `select up.credit_at_purchase as credits, up.credits_used as usedcredits, up.expiry_date from user_plans up where up.user_id = ${user_id} and up."isActive" = true`);

                    if (response) {
                        const remainingCredits = response.credits - response.usedcredits;
                        if (response.credits > 0) {
                            const values =       {
                                usedCredits : response.usedcredits,
                                totalCredits : response.credits,
                                remainingCredits
                                
                            };
                            const resp = generateResponse(true, 'Data Fetched Successfully', values);
                            this.logger.info(`user > getUserCredits : Data Fetched Successfully ${JSON.stringify(values)}`);
                            return resp;
                        } else {
                            ctx.meta.$statusCode = 404;
                            this.logger.error(`Error : User > getUserCredits : 'No Credit Found'`);
                            return generateResponse(false, 'No Credit Found');
                        }                        
                    } else {
                        this.logger.error(`Error : User > getUserCredits : 'Not Found'`);
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }

                } catch (error) {
                    this.logger.error(`Error : User > getUserCredits : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        getUserActivePlan: {
            auth: "required",
            rest: {
                method: "get",
                path: "/getUserActivePlan"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`Get user active plan > plan details : Service Starting ${JSON.stringify(ctx.params)}`);
                    const { user_id } = ctx.meta.user;

                    let userExist = false;
                    userExist = await this.getUserById(user_id);
                    if (!userExist) {
                        this.logger.info(`Get user active plan > plan details : user does not  exist `);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user does not exist');
                    }
                    const currentDate = moment().utc().format('YYYY-MM-DD');

                    const [response] = await rawQuery(this.db['sequelize'], `SELECT p.*, user_plans.plan_price as price, user_plans.user_plan_id FROM "user_plans" AS "user_plans" join "plans" AS "p" 
                    on "user_plans"."plan_id" = "p"."plan_id" WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" =true LIMIT 1`);

                    if (response) {
                        const resp = generateResponse(true, 'Active plan fetched successfully', response);
                        this.logger.info(`Get user active plan > plan details : Active plan fetched successfully`);
                        transaction.commit();
                        return resp;

                    } else {
                        await transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        this.logger.info(`Get user active plan > plan details : Failed to get user active plan`);
                        return await generateResponse(false, 'No active plan available');
                    }
                }
                catch (error) {
                    await transaction.rollback();
                    this.logger.error(`Error : Failed to get user active plan : ${JSON.stringify(error)}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Server-Error', error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        resolveToken: {
			params: {
				token: "string"
			},
			async handler(ctx) {
				const decoded = await new this.Promise((resolve, reject) => {
					jwt.verify(ctx.params.token, process.env.JWT_SECRET, (err, decoded) => {
						if (err){
							return reject(err);
						}
                       // Check if the token is the latest token for the user
                        if (userTokens[decoded.user_id] && !userTokens[decoded.user_id].includes(ctx.params.token)) {
                            return reject('Token expired');
                        }
						resolve(decoded);
					});
				});

				if (decoded.user_id){
                    let data = await this.getUserById(decoded.user_id);
                    data.user_detail_id = decoded.user_detail_id
                    data.cognitoId = decoded.cognitoId
					return data
				}
			}
		},

        addUserTopics: {
            auth: "required",
            rest: {
                method: "PUT",
                path: "/addUserTopics"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user;
                    this.logger.info(`users > addUserTopics : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = addUserTopicsValidation.validate({query :{user_id}, body : ctx.params.body});
                    if (validate.error) {
                        this.logger.info(`users > addUserTopics : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { topic_id } = ctx.params.body;
                    const duplicateValues = [];

                    const promises = topic_id.map(async (topic_id) => {
                        try {
                          const response = await create(this.db['user_topics'], { topic_id, user_id });
                          return response;
                        } catch (error) {
                          if (error.name === 'SequelizeUniqueConstraintError') {
                            duplicateValues.push(topic_id.toString());
                          } else {
                            throw error;
                          }
                        }
                      });
                      
                      // Wait for all the insertion promises to resolve
                      const results = await Promise.all(promises);
                      const successfulInsertions = results.filter((result) => result !== null);
                      
                      if (successfulInsertions.length > 0) {
                        const resp = generateResponse(true, 'User topics added successfully', {
                          duplicates: duplicateValues,
                        });
                        this.logger.info(
                          `Users > addUserTopics: User topics added successfully: ${JSON.stringify(results)}`
                        );
                        return resp;
                      } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in adding user topics');
                      }
                } catch (error) {
                    this.logger.info(`users > addUserTopics : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getMostOnFruitGPT: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getMostOnFruitGPT"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`users > getMostOnFruitGPT : Service Starting ${JSON.stringify(ctx.params)}`);

                    const {query} = ctx.params;

                    const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
					const limit = (query.limit) ? query.limit : 3;
					const offset = page * limit - limit;

                    const response = await findAndCountAll(this.db['response_history'],{}, [['count', 'desc']], ['id','question','response' ,'count'], limit,page, offset);
                    if (response) {
                        const resp = await generateResponse(true, 'Data fetched successfully', response);
                        this.logger.info(`user > getMostOnFruitGPT : Data fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`user > getMostOnFruitGPT : Not Found`);
                        return await generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.info(`users > getMostOnFruitGPT : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        updateTopics: {
            auth: "required",
            rest: {
                method: "PUT",
                path: "/updateTopics"
            },
            async handler(ctx) {
                const t = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`users > updateTopics : Service Starting`);
                    const { user_id } = ctx.meta.user;

                    const validate = addUserTopicsValidation.validate({query :{user_id}, body : ctx.params.body});
                    if (validate.error) {
                        this.logger.info(`users > updateTopics : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    const { topic_id } = ctx.params.body;

                    const response1 = await deleteManyRecord(this.db['user_topics'], {user_id});
                    const response2 =  await bulkInsertData(this.db['user_topics'], topic_id.map(topic => ({
                        user_id,
                        topic_id: topic
                    })), t);

                    await t.commit();

                    if (response2) {
                        const resp = generateResponse(true, 'Topics Updated Successfully', response2 );
                        this.logger.info(`users > updateTopics : Topics Updated Successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false,'Failed to update details.');
                    }

                } catch (error) {
                    await t.rollback();
                    this.logger.error(`users > updateTopics : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false,error?.message || 'Something went wrong, Please try again', error)
                }
            }
        },

        // getInvestorStories: {
        //     auth: "required",
        //     rest: {
        //         method: "GET",
        //         path: "/getInvestorStories"
        //     },
        //     async handler(ctx) {
        //         try {
        //             this.logger.info(`Users > Get Investor Stories : Service Starting `);
        //             const { user_id } = ctx.meta.user;

        //             const watchlistQuery = `SELECT w."watchlist_id", w."user_id", w."isActive" AS watchlist_active, ws."ticker", ws."ticker_name", ws."isActive"
        //                     FROM watchlists AS w INNER JOIN watchlist_stocks AS ws ON w."watchlist_id" = ws."watchlist_id" WHERE w."user_id" = ${user_id} AND
        //                     w."isActive" = true AND ws."isActive" = true;`

        //             const getWatchlistStocks = await rawQuery(this.db['sequelize'], watchlistQuery)
        //             const tickers = getWatchlistStocks.map(item => item.ticker);

        //             const topicsQuery = `SELECT c."user_topics_id", c."user_id", c."topic_id", c."isActive", t."topic_name", t."topic_alias" 
        //             FROM user_topics AS c LEFT JOIN topics AS t ON c."topic_id" = t."topic_id" where c."user_id" = ${user_id} and c."isActive" = true
        //             and t."isActive" = true`

        //             const getTopics = await rawQuery(this.db['sequelize'], topicsQuery)
        //             const topicName = getTopics?.map(item => item.topic_alias)?.filter(alias => alias !== null);
                    
        //             const url = `${process.env.AI_URL}investor_stories`
        //             const requestData = {  stock_names: tickers };
                    
        //             const stories = await fetch(url, {
        //                 method: 'POST',
        //                 headers: {
        //                   'API-Key': process.env.AICHAT_KEY,
        //                   'Content-Type': 'application/json'
        //                 },
        //                 body: JSON.stringify(requestData)
        //             })
                    
        //             if (stories.status === 200 && stories.statusText == 'OK') {
        //                 const storiesData = await stories.json();
        //                 console.log('storiesData===========', storiesData)
        //                 this.logger.info(`Users > Get Investor Stories : Stories Fetched Successfully ${JSON.stringify(stories)}`);
        //                 const resp = generateResponse(true, 'Stories fetched successfully', storiesData);
        //                 return resp;
        //             } else {
        //                 ctx.meta.$statusCode = 404;
        //                 return generateResponse(false, 'Unable to fetch stories');
        //             }

        //         } catch (error) {
        //             if ((error?.code === "ECONNREFUSED") || (error?.cause?.code === "ECONNREFUSED")) {
        //                 ctx.meta.$statusCode = 503; 
        //                 return generateResponse(false, 'Connection refused. Please try again later.');
        //             }
        //             this.logger.info(`Users > Get Investor Stories : Internal Server Error : ${error}`);
        //             ctx.meta.$statusCode = 500;
        //             return generateResponse(false, error || 'Something Went Wrong');
        //         }
        //     }
        // },

        getInvestorStories: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getInvestorStories"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`investor > getInvestorStories  : Service Starting `);
                    const getInvestorStories = await findOne(this.db['investor_stores_data'], { isActive: true })
                    console.log('getInvestorStories==========', getInvestorStories.data)
                    if (getInvestorStories) {
                        return generateResponse(true, 'Investor Stories  fetched successfully', getInvestorStories.data);
                    } else {
                        ctx.meta.$statusCode = 400;
                        return { status: false, message: 'No data found' };
                    }

                } catch (error) {
                    console.log('error=======', error)
                    this.logger.info(`investor > getInvestorStories  : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },


        // Get user clicked event details
        getUserClickedEvent: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getUserClickedEvent"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`user_event_click > user event click lists : Service Starting `);
                    
                    const validate = eventIdValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`users > user_event_click > getUserClickedEvent : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validate.error.message.replace(/\"/g, '')}`);
                    }
                    
                    const { user_id } = ctx.meta.user;
                    const { event_id } = ctx.params.query;

                    const response = await findOne(this.db['user_event_clicks'], { user_id, event_id });
                    if (response) {
                        const resp = generateResponse(true, 'Data Fetched Successfully', response);
                        this.logger.info(`users > user_event_click > getUserClickedEvent : Data Fetched Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Not Found');
                    }
                } catch (error) {
                    this.logger.error(`users > user_event_click > getUserClickedEvent : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        // Deduct creditd on clicked event
        deductEventCredits: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/deductEventCredits"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`user_event_click > deductEventCredits : Service Starting `);

                    const { user_id } = ctx.meta.user;
                    const { event_id } = ctx.params.query;
        
                    // Validate event ID
                    const validate = eventIdValidation.validate(ctx.params);
                    if (validate.error) {
                        ctx.meta.$statusCode = 400;
                        throw new Error(`${validate.error.message.replace(/\"/g, '')}`);
                    }

                    // Check if event click already exists
                    const event_clicks_response = await findOne(this.db['user_event_clicks'], { user_id, event_id });
                    if(event_clicks_response){
                        const resp = generateResponse(true, 'Credit already deducted', event_clicks_response);
                        this.logger.info(`users > user_event_click > deductEventCredits : Credit already deducted ${JSON.stringify(event_clicks_response)}`);
                        return resp;
                    }

                    // Fetch event details
                    const eventResponse = await findOne(this.db['qa_responses'], { id:event_id },{fieldsToFetch:["id","credit_charge"]});
                    if (!eventResponse) {
                        ctx.meta.$statusCode = 404;
                        throw new Error(`Event not found with given event ID`);
                    }

                    // Checking if user has active plan or not
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);

                    if (!response) {
                        ctx.meta.$statusCode = 404;
                        throw new Error('No Active Plan Found');
                    }

                     // Calculate available credit and check if it's sufficient
                    const avlcredit = response.credit_at_purchase - response.credits_used;
                    if (avlcredit < eventResponse.credit_charge) {
                        ctx.meta.$statusCode = 400;
                        throw new Error('Credit Exhausted');
                    }

                    // Update user credits
                    const updateUserCredits = await updateRecords(this.db['user_plans'], { credits_used: (response.credits_used + eventResponse.credit_charge).toFixed(2) }, { user_plan_id: response.user_plan_id, plan_id: response.plan_id }, transaction);

                    this.logger.info(`users > user_event_click > deductEventCredits : user credit updated ${JSON.stringify(updateUserCredits)}`);

                    // Create credit usage record
                    const createCreditUses = await create(this.db['credit_usage'], {
                        user_id,
                        plan_id: response.plan_id,
                        credit_used: (eventResponse.credit_charge).toFixed(2)
                    }, transaction);

                    this.logger.info(`users > user_event_click > deductEventCredits : credit_usage created ${JSON.stringify(createCreditUses)}`);

                    // Create user event click record
                    const createUserEventClick = await create(this.db['user_event_clicks'], {
                        user_id,
                        event_id,
                        credit_used: eventResponse.credit_charge
                    }, transaction);

                    this.logger.info(`users > user_event_click > deductEventCredits : created record for clicked on event ${JSON.stringify(createUserEventClick)}`);

                    const resp = generateResponse(true, 'Credit deducted Successfully', createUserEventClick);
                    this.logger.info(`users > user_event_click > deductEventCredits : Credit deducted Successfully ${JSON.stringify(response)}`);

                     // Commit transaction
                    transaction.commit();

                    return resp;
                        
                    
                } catch (error) {
                    // Rollback transaction in case of error
                    await transaction.rollback();
                    this.logger.error(`users > user_event_click > deductEventCredits : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = ctx.meta.$statusCode? ctx.meta.$statusCode: 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },        
        fetchAllDetailsBasedOnCompany: {
            rest: {
                method: "GET",
                path: "/fetchAllDetailsBasedOnCompany"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`user > fetchAllDetailsBasedOnCompany : Service Starting `);
                    const { company_id, date } = ctx.params.query;
                    const tableNames = [
                        { tableName: 'company_profile', columnName: 'CO_CODE' },
                        { tableName: 'company_background', columnName: 'CO_CODE' },
                        // { tableName: 'board_of_directors', columnName: 'CO_CODE' },
                        { tableName: 'directors_report', columnName: 'co_code' },
                        // { tableName: 'chairmans_report', columnName: 'co_code' },
                        // { tableName: 'bankers', columnName: 'co_code' },
                        // { tableName: 'management_bio_data', columnName: 'co_code' },
                        { tableName: 'auditors_reports', columnName: 'co_code' },
                        // { tableName: 'notes_to_account', columnName: 'co_code' },
                        { tableName: 'finished_products', columnName: 'co_code' },
                        { tableName: 'raw_materials', columnName: 'CO_CODE' },
                        { tableName: 'related_party_transaction', columnName: 'CO_CODE' },
                        // { tableName: 'subsidiaries_collaborations', columnName: 'CO_CODE' },
                        { tableName: 'defferd_tax', columnName: 'CO_CODE' },
                        { tableName: 'r_d', columnName: 'CO_CODE' },
                        // { tableName: 'chairmans_speech_report', columnName: 'CO_CODE' },
                        // { tableName: 'chronological_history', columnName: 'CO_CODE' },
                        // { tableName: 'company_history', columnName: 'CO_CODE' },
                        // { tableName: 'company_history', columnName: 'CO_CODE' },
                        { tableName: 'company_locations', columnName: 'CO_CODE' },
                        // { tableName: 'credit_rating_info', columnName: 'CO_CODE' },
                        // { tableName: 'company_employee_count', columnName: 'co_code' },
                        { tableName: 'capital_structure', columnName: 'co_code' },
                        { tableName: 'corporate_governance', columnName: 'co_code' },
                        { tableName: 'pledge_shares_details', columnName: 'co_code' },
                        { tableName: 'pledge_shares_details', columnName: 'co_code' },
                        // CRAR
                        // Company-Listing-Exchange-Information
                        // Registrar-Details
                        { tableName: 'quaterlyResults', columnName: 'cocode' },
                        { tableName: 'pnLStatement', columnName: 'cocode' },
                        { tableName: 'cashFlow', columnName: 'cocode' },
                        { tableName: 'halfYearlyResults', columnName: 'cocode' },
                        { tableName: 'nineMonthResult', columnName: 'cocode' },
                        { tableName: 'shareHoldingPattern', columnName: 'co_code' },
                        { tableName: 'shareHoldingPatternMoreThan1', columnName: 'co_code' },
                        { tableName: 'yearlyResults', columnName: 'cocode' },
                        { tableName: 'resultBalanceSheetQuarterly', columnName: 'cocode' },
                        { tableName: 'resultBalanceSheetHalfYearly', columnName: 'cocode' },
                        { tableName: 'resultBalanceSheetYearly', columnName: 'cocode' },
                        { tableName: 'margin_ratios', columnName: 'co_code' },
                        { tableName: 'performance_ratios', columnName: 'co_code' },
                        { tableName: 'efficiency_ratios', columnName: 'co_code' },
                        { tableName: 'financial_stability_ratios', columnName: 'co_code' },
                        { tableName: 'valuation_ratios', columnName: 'co_code' },
                        { tableName: 'cashflow_ratios', columnName: 'co_code' },
                        { tableName: 'liquidity_ratios', columnName: 'co_code' },
                        { tableName: 'daily_ratios', columnName: 'co_code' },
                        { tableName: 'return_ratios', columnName: 'CO_CODE' },
                        { tableName: 'solvency_ratios', columnName: 'CO_CODE' },
                        { tableName: 'growth_ratios', columnName: 'co_code' },
                        { tableName: 'quaterly_ratios', columnName: 'co_code' },
                        { tableName: 'yearly_ratios', columnName: 'co_code' },
                        { tableName: 'yearly_result_based_ratios', columnName: 'CO_CODE' }, 
                        { tableName: 'book_closer', columnName: 'co_code' }, 
                        { tableName: 'board_meetings', columnName: 'co_code' }, 
                        { tableName: 'bonus_issues', columnName: 'co_code' }, 
                        { tableName: 'right_issues', columnName: 'co_code' }, 
                        { tableName: 'agm', columnName: 'co_code' }, 
                        { tableName: 'egm', columnName: 'co_code' }, 
                        { tableName: 'splits', columnName: 'co_code' }, 
                        { tableName: 'company_merger', columnName: 'co_code' }, 
                        { tableName: 'company_buyback', columnName: 'co_code' }, 
                        { tableName: 'corporate_news', columnName: 'co_code' }                        
                    ];
                
                    // Validate event ID
                    const validate = fetchAllDetailsBasedOnCompanyValidation.validate(ctx.params);
                    if (validate.error) {
                        ctx.meta.$statusCode = 400;
                        throw new Error(`${validate.error.message.replace(/\"/g, '')}`);
                    }
                
                    const promisesWithNames = tableNames.map(element => {
                        const response = findAll(this.db[element.tableName], { 
                            [element.columnName]: company_id,
                            [Op.and]: where(
                                literal(`DATE("createdAt")`),
                                '=',
                                date
                            )
                        });
                        return { promise: response, tableName: element.tableName };
                    });
                
                    // Execute all promises and handle their responses
                    const promiseArray = promisesWithNames.map(p => p.promise);
                    const results = await Promise.allSettled(promiseArray);
                
                    let promiseResponse = {};
                    results.forEach((result, index) => {
                        const tableName = promisesWithNames[index].tableName;
                        if (result.status === 'fulfilled') {
                            promiseResponse[tableName] = result.value;
                        } else {
                            this.logger.error(`Error fetching data for ${tableName}: ${result.reason}`);
                            promiseResponse[tableName] = [];  // Choose how to handle errors
                        }
                    });
                
                    const resp = generateResponse(true, 'Data fetched successfully', promiseResponse);
                    return resp;
                
                } catch (error) {
                    this.logger.error(`users > fetchAllDetailsBasedOnCompany : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = ctx.meta.$statusCode ? ctx.meta.$statusCode : 500;
                    return generateResponse(false, error.message || 'Something Went Wrong');
                }
            }
        },

        resendOtp: {
            rest: {
                method: "POST",
                path: "/resendOtp",
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`user > resendOtp : Service Starting ${JSON.stringify(ctx.params.body)}`);
                    const validation = resendOtpValidation.validate(ctx.params || {});
                    if (validation.error) {
                        await transaction.rollback();
                        this.logger.info(`user > resendOtp : Validation Error : ${validation.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validation.error.message.replace(/\"/g, '')}`);
                    }

                    const { type, mobile, email } = ctx.params.body;

                    const expiry_date = moment().utc().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

                    if (type === 'mobile') {
                        const mobileotp = '999000';
                        const token_id = md5(mobileotp);
                        const data = {
                            expireTime: expiry_date,
                            type: 'mobile',
                            otp: token_id,
                            mobile: mobile
                        }
                        await updateRecords(this.db['otp'], { isActive: false },
                            {
                                type, mobile, isActive: true
                            }, transaction);
                        await create(this.db['otp'], data, transaction);
                        const resp = await generateResponse(true, 'OTP has been sent successfully');
                        this.logger.info(`OTP > SEND : OTP Email has sent successfully`);
                        transaction.commit();
                        return resp;
                    } else {
                        const otp = await generateOtp(6);
                        let mailOptions = {
                            from: EmailConfig.auth.user,
                            to: email,
                            subject: "OTP for signup",
                            attachments: [
                                {
                                    filename: 'VerificationImage.png',
                                    path: './uploads/VerificationImage.png',
                                    cid: 'verify'
                                },
                            ],
                            html: verificationTemplate(otp),
                        };

                        const transporter = Nodemailer.createTransport(EmailConfig);

                        await transporter.sendMail(mailOptions).catch(async (err) => {
                            this.logger.info(`OTP > SEND : Failed to sent otp`);
                            return await generateResponse(false, 'Failed to sent OTP');
                        });

                        const emaildata = {
                            expireTime: expiry_date,
                            type: 'email',
                            otp: md5(otp),
                            emailId: email,
                        }
                        await updateRecords(this.db['otp'], { isActive: false },
                            {
                                type, emailId: email, isActive: true
                            }, transaction);
                        await create(this.db['otp'], emaildata, transaction);
                        const resp = await generateResponse(true, 'OTP Email has sent successfully');
                        this.logger.info(`OTP > SEND : OTP Email has sent successfully`);
                        transaction.commit();
                        return resp;
                    }
                } catch (error) {
                    await transaction.rollback();
                    this.logger.info(`User > signup : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        userFeedback: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/userFeedback"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`user > userFeedback : Service Starting ${JSON.stringify(ctx.params)}`);
                    
                    const { user_id } = ctx.meta.user;
                    const { title, notes, attachment } = ctx.params.body;
    
                    this.logger.info(`Received attachment: ${JSON.stringify(attachment)}`);
    
                    const validate = await userFeedbackValidation.validate(ctx.params.body);
                    if (validate.error) {
                        this.logger.info(`user > userFeedback : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const user = await findOne(this.db['users'], { user_id })
                    if (!user) {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'User not found');
                    }
                    const phone_number = user?.phone_number
                    const email = user?.email

                    const userDetails = await findOne(this.db['user_details'], { user_id })
                    if (!userDetails) {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'User not found');
                    }
                    const firstName = userDetails?.first_name
                    const lastname = userDetails?.last_name
                    
                    const attachments = Array.isArray(attachment) ? attachment : [attachment];
                    
                    const storedFeedbacks = [];
                    for (const attach of attachments) {
                        const payload = { 
                            user_id, 
                            title, 
                            note: notes, 
                            attachment: attach
                        };
    
                        const response = await create(this.db['userFeedback'], payload);
    
                        if (response) {
                            storedFeedbacks.push(response);
                            this.logger.info(`user > userFeedback : Data Added Successfully ${JSON.stringify(response)}`);
                        } else {
                            this.logger.info(`user > userFeedback : Failed to store feedback for attachment: ${attach}`);
                        }
                    }
                    if (storedFeedbacks.length > 0) {
                        await this.sendFeedbackToAdmin(user_id, title, notes, attachments, phone_number, email, firstName, lastname);
                        return generateResponse(true, 'Data Added Successfully', storedFeedbacks);
                    } else {
                        ctx.meta.$statusCode = 404;
                        return generateResponse(false, 'Failed to add data');
                    }
                } catch (error) {
                    this.logger.info(`user > userFeedback : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return { status: false, message: 'Something Went Wrong' };
                }
            }
        },

        getDataFromS3: {
            // auth: "required",
            rest: {
                method: "GET",
                path: "/getDataFromS3"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`users > getDataFromS3 : Service Starting`);
                    const { key } = ctx.params.query;

                    if (!key) {
                        this.logger.info(`users > getDataFromS3 : Validation Error : key is required`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', 'Key is required');
                    }

                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key,
                    };

                    const url = await S3Bucket.getSignedUrlPromise('getObject', params);

                    return generateResponse(true, 'Image URL retrieved successfully', { url });

                } catch (error) {
                    this.logger.info(`users > getDataFromS3 : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, 'Something went wrong, Please try again');
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
        async checkEmailId(email) {
            try {
                const user = await findOne(this.db['users'], { email, isActive: true });
                if (user) {
                    return true
                } else {
                    return false;
                }
            } catch (error) {
                throw error
            }
        },

        async getUserById(user_id) {
            try {
                const user = await findOne(this.db['users'], { user_id, isActive: true });
                if (user) {
                    return user
                } else {
                    return false;
                }
            } catch (error) {
                throw error
            }
        },

        async checkMobileNumber(mobile) {
            try {
                const user = await findOne(this.db['users'], { phone_number: mobile });
                if (user) {
                    return user;
                } else {
                    return false;
                }
            } catch (error) {
                throw error
            }
        },
        async checkOtpExistence(type, field, data) {
            try {
                const currentDate = moment().format('YYYY-MM-DD h:mm:ss')
                const otp = await findOne(this.db['otp'], {
                    [field]: data, isActive: true, expireTime: {
                        [Sequelize.Op.gt]: currentDate
                    }
                })

                if (otp) {
                    return true
                } else {
                    return false;
                }
            } catch (error) {
                throw error
            }
        },

        async sendOTPMethod(type, value,subject, title, body) {
            const transaction = await this.db.sequelize.transaction();
            return new Promise(async (resolve, reject) => {
                try {
                    const otp = await generateOtp(6);
                    console.log("otp", otp);
                    const expiry_date = moment().utc().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                    const token_id = md5(otp);
                    if (type && type === 'mobile') {
                        // const isSendMobileOtp = await sendMobileOTP(value, otp);
                        // if (isSendMobileOtp && isSendMobileOtp.Status === "Success") {
                        if (true) {
                            const data = {
                                expireTime: expiry_date,
                                type: 'mobile',
                                otp: md5('999000'),
                                mobile: value
                            }
                            await create(this.db['otp'], data, transaction);
                            transaction.commit();
                            resolve(true);
                        } else {
                            await transaction.rollback();
                            reject(false);
                        }
                    } else {
                        let mailOptions = {
                            from: EmailConfig.auth.user,
                            to: value,
                            subject: subject?subject:'OTP',
                            attachments: [
                                {
                                    filename: 'VerificationImage.png',
                                    path: './uploads/VerificationImage.png',
                                    cid: 'verify'
                                },
                            ],
                            html: verificationTemplate(otp),
                        };

                        const transporter = Nodemailer.createTransport(EmailConfig);

                        let error = null;

                        const response = await transporter.sendMail(mailOptions).catch(async (err) => {
                            error = err.message;
                            this.logger.info(`OTP > SEND : Failed to sent otp`);
                            await transaction.rollback();
                            return await generateResponse(false, 'OTP', 'Failed to sent OTP');
                        });

                        if (response !== null && error === null) {
                            const emaildata = {
                                expireTime: expiry_date,
                                type: 'email',
                                otp: token_id,
                                emailId: value,
                            }
                            await create(this.db['otp'], emaildata, transaction);
                            transaction.commit();
                            resolve(true);
                        } else {
                            await transaction.rollback();
                            reject(false);
                        }

                    }
                } catch (err) {
                    await transaction.rollback();
                    throw (err);
                }

            });
        },

        async verifyOtp(type, mobile, email, otp, transaction = null) {
            return new Promise(async (resolve, reject) => {
                try {
                    const currentDate = moment().utc().format('YYYY-MM-DD hh:mm:ss');

                    const hashedUserOTP = md5(otp.toString());

                    const otpExpired = await findOne(this.db['otp'], {
                        type, [type === 'mobile' ? 'mobile' : 'emailId']: type === 'mobile' ? mobile : email, isActive: true, expireTime: {
                            [Sequelize.Op.gt]: currentDate
                        }
                    })

                    if (!otpExpired) {
                        this.logger.info(`user > verifyOtp : otpExpired : ${JSON.stringify(otpExpired)}`);
                        // return generateResponse(false, 'OTP', `Invalid OTP.`);
                        reject({ status: false, message: 'OTP Expired!' })
                    }

                    const checkOtp = await findOne(this.db['otp'], {
                        type, [type === 'mobile' ? 'mobile' : 'emailId']: type === 'mobile' ? mobile : email, isActive: true, expireTime: {
                            [Sequelize.Op.gt]: currentDate
                        }, otp: hashedUserOTP
                    })

                    if (checkOtp) {
                        await updateRecords(this.db['otp'], { isActive: false },
                            {
                                type, [type === 'mobile' ? 'mobile' : 'emailId']: type === 'mobile' ? mobile : email, isActive: true
                            }, transaction);
                        resolve({ status: true, message: 'OTP Verified' });
                    } else {
                        // ctx.meta.$statusCode = 400;
                        // return generateResponse(false, 'OTP', 'OTP does not match');
                        this.logger.info(`user > verifyOtp : OTP does not match`);
                        reject({ status: false, message: 'OTP does not match' });
                    }
                } catch (err) {
                    this.logger.info(`user > verifyOtp : Internal Error : ${JSON.stringify(err)}`);
                    reject({ status: false, message: 'Internal Error' });
                }
            });
        },

        async sendFeedbackToAdmin(user_id, title, notes, attachments, phone_number, email, firstName, lastname) {
            try {
                const adminEmail = 'config@airrchip.com';
        
                const emailAttachments = await Promise.all(
                    attachments.map(async (attachment) => {
                        const response = await axios.get(`${process.env.IMAGE_BASE_URL}/users/getDataFromS3?key=${attachment}`);
                        console.log('API Response for attachment:', attachment, response.data);
                        
                        const { url } = response.data.data; 
                        console.log('url', url)
        
                        return {
                            filename: attachment.split('/').pop(),
                            path: url,
                        };
                    })
                );
        
                let mailOptions = {
                    from: process.env.senderEmail,
                    to: adminEmail,
                    subject: "New User Feedback Received",
                    attachments: emailAttachments,
                    html: `
                        <p><strong>A new feedback has been submitted by user:<strong> ${firstName} ${lastname}.</p>
                        <p><strong>User Phone Number:</strong> ${phone_number}.</p>
                        <p><strong>User Email:</strong> ${email}.</p>
                        <p><strong>Title:</strong> ${title}</p>
                        <p><strong>Notes:</strong> ${notes}</p>
                    `,
                };
        
                const transporter = Nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: process.env.senderEmail,
                        pass: process.env.senderEmailPass,
                    },
                });
        
                await transporter.sendMail(mailOptions);
                this.logger.info(`Feedback > SendEmail : Email sent successfully to admin.`);
            } catch (error) {
                this.logger.error(`Feedback > SendEmail : Failed to send email to admin. Error: ${error}`);
            }
        }
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
