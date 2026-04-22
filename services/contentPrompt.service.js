"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin.js");
const { create, findOne, updateRecords, findAll, findAndCountAll, rawQuery, insertMany } = require("../utils/postgresUtils.js");
const { generateResponse, getStartEndDate, generateTimestamp } = require("../utils/utility.js");
const moment = require("moment");
const { Sequelize } = require("sequelize");
const { linkAndAttchmentValidation, signedURLValidation, addDocumentValidation, triggerDocumentChatValidation, getContentPromptHistoryByPromptId, deleteContentPromptValidation, triggerContentValidation, triggerAttachmentContentValidation } = require('../validation/contentPromptValidation.js');
require('dotenv').config();
const AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const S3Bucket = new AWS.S3({
    signatureVersion: 'v4',
    params: { Bucket: process.env.AWS_BUCKET_NAME },
});

/** @type {ServiceSchema} */
module.exports = {
    name: "contentPrompt",
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
        triggerContentPrompt: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerContentPrompt"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`prompts > triggerContentPrompt : Service Starting`);
                    const validate = linkAndAttchmentValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { link } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    // Checking if user has active plan or not
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);

                    // if (!response) {
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = await generateResponse(true, 'No Active Plan Found');
                    //     this.logger.info(`prompts > triggerContentPrompt: No Active Plan Found`);
                    //     transaction.rollback();
                    //     return resp;
                    // }

                    const [linkExist] = await rawQuery(this.db['sequelize'], `SELECT
                            "cp"."content_prompt_id",
                            "cp".content_prompt_type,
                            "cp".content_prompt_text, 
                            "cp".link_title, 
                            "cp"."creditUsed",
                            cph."text" AS "bot_text"
                        FROM 
                            "content_prompt" AS "cp"
                        LEFT JOIN content_prompt_history cph on cph.content_prompt_id = cp.content_prompt_id
                        WHERE 
                            "cp"."content_prompt_text" = '${link}' and 
                            "cp"."content_prompt_type" = 'link' and 
                            cph."person" = 'bot'
                        `);

                    if (linkExist) {
                       const listExistData =  await this.updateData(user_id, link, response, linkExist?.creditUsed, linkExist?.bot_text, transaction, true, linkExist?.link_title )
                        transaction.commit();
                        this.logger.info(`prompts > triggerContentPrompt : Success : ${JSON.stringify(linkExist?.bot_text)}`);
                        return generateResponse(true, 'Triggered Successfully', {data:JSON.parse(linkExist?.bot_text), prompt_id: listExistData?.content_prompt_id });

                    }

                    // Link/YouTube summarization — coming soon
                    const stubText = "Link and YouTube summarization is not available yet. Please check back later.";
                    const res = await this.updateData(user_id, link, response, 0, stubText, transaction, false, link);
                    transaction.commit();
                    this.logger.info(`prompts > triggerContentPrompt : stub response`);
                    return generateResponse(true, 'Triggered Successfully', { data: stubText, prompt_id: res?.content_prompt_id });
                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`prompts > triggerContentPrompt : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getSignedUrl: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getSignedUrl"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`contentPrompt > getSignedUrl : Service Starting`);
                    const validate = signedURLValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`contentPrompt > getSignedUrl : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { fileName, fileType } = ctx?.params?.query;

                    const Key = fileName;
                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key,
                        Expires: 15 * 60, // 15 minutes
                        ContentType: fileType,
                    };
                    const url = await S3Bucket.getSignedUrlPromise('putObject', params);
                    if (url) {
                        return generateResponse(true, 'url created', url);
                    } else {
                        return generateResponse(false, 'url not created', url);
                    }

                } catch (error) {
                    this.logger.info(`contentPrompt > getSignedUrl : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        addDocumentPrompt: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/addDocument"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`prompts > addDocument : Service Starting`);
                    const validate = addDocumentValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`prompts > addDocument : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { object_key} = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    // Checking if user has active plan or not
                    const timeStamp = generateTimestamp()
                    const fileName = user_id+timeStamp
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);
                    
                    // if (!response) {
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = await generateResponse(true, 'No Active Plan Found');
                    //     this.logger.info(`prompts > addDocument: No Active Plan Found`);
                    //     await transaction.rollback();
                    //     return resp;
                    // }

                    // Document indexing — coming soon; store the record for future use
                    const docRecord = await create(this.db['content_prompt'], {
                        user_id,
                        content_prompt_type: "attachment",
                        content_prompt_text: fileName,
                        contentS3Path: object_key
                    });
                    if (docRecord) {
                        transaction.commit();
                        this.logger.info(`prompts > addDocumentPrompt : Document registered`);
                        return generateResponse(true, 'Prompts Added Successfully', { prompt_id: docRecord.content_prompt_id });
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in adding document');
                    }
                } catch (error) {
                    console.log('error:::::::::::::::::::', error)
                    this.logger.info(`contentPrompt > addDocument : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        triggerDocumentChat: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerDocumentChat"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`contentPrompt > triggerDocumentChat : Service Starting`);
                    const validate = triggerDocumentChatValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`contentPrompt > triggerDocumentChat : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { message, prompt_id } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    const promptResponse = await findOne(this.db['content_prompt'], { user_id, isActive: true, content_prompt_id: prompt_id });

                    if (!promptResponse) {
                        this.logger.info(`contentPrompt > triggerDocumentChat : Prompt does not exist`);
                        ctx.meta.$statusCode = 409;
                        return generateResponse(false, 'Prompt does not exist')
                    }

                    // Checking if user has active plan or not
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);

                    // if (!response) {
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = await generateResponse(true, 'No Active Plan Found');
                    //     this.logger.info(`prompts > triggerChat: No Active Plan Found`);
                    //     transaction.rollback();
                    //     return resp;
                    // }

                    // Document Q&A — coming soon
                    const stubReply = "Document Q&A is not available yet. Please check back later.";
                    await insertMany(this.db['content_prompt_history'], [
                        { user_id, content_prompt_id: prompt_id, person: 'user', text: message, type: 'attachment', render_type: 'text' },
                        { user_id, content_prompt_id: prompt_id, person: 'bot', text: stubReply, type: 'attachment', render_type: 'text' }
                    ], { transaction });
                    transaction.commit();
                    this.logger.info(`contentPrompt > triggerDocumentChat : stub response`);
                    return generateResponse(true, 'Triggered Successfully', stubReply);
                } catch (error) {
                    this.logger.info(`contentPrompt > triggerDocumentChat : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getContentPromptHistory: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getContentPromptHistory"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user
                    const { type } = ctx.params.query

                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }
                    this.logger.info(`contentPrompt > getContentPromptHistory : Service Starting`);

                    let response;

                    if (type) {
                        response = await findAndCountAll(this.db['content_prompt'], { user_id: user_id, content_prompt_type: type, isActive: true }, [['createdAt', 'desc']], {});
                    } else {
                        response = await findAndCountAll(this.db['content_prompt'], { user_id: user_id, isActive: true }, [['createdAt', 'desc']], {});
                    }

                    const groupedData = response.rows.reduce((acc, item) => {
                        const date = item.createdAt.split('T')[0];
                        const existingDateIndex = acc.findIndex((group) => group.date === date);

                        if (existingDateIndex !== -1) {
                            acc[existingDateIndex].data.push(item);
                        } else {
                            acc.push({ date, data: [item] });
                        }
                        return acc;
                    }, []);

                    if (groupedData) {
                        const resp = generateResponse(true, 'content prompts history fetched successfully', groupedData)
                        this.logger.info(`contentPrompt > getContentPromptHistory : content prompts history fetched successfully`);
                        return resp
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.info(`contentPrompt > getContentPromptHistory : Content Prompts history doesnt exists`);
                        return generateResponse(true, 'Not found', 'Content Prompts hostory does not exists')

                    }
                } catch (error) {
                    this.logger.info(`contentPrompt > getContentPromptHistory : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getContentPromptHistoryByContentPromptId: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getContentPromptHistoryByContentPromptId"
            },
            async handler(ctx) {
                try {
                    this.logger.info(`contentPrompt > getContentPromptHistoryByContentPromptId : Service Starting`);
                    const { user_id } = ctx.meta.user;
                    const { content_prompt_id } = ctx.params.query;
                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }

                    const validate = getContentPromptHistoryByPromptId.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`contentPrompt > getContentPromptHistoryByContentPromptId : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const response = await findAll(this.db['content_prompt_history'], { user_id, content_prompt_id, isActive: true }, [['content_prompt_history_id', 'ASC']], {});

                    if (response) {
                        const resp = generateResponse(true, 'content prompt history fetched successfully', response);
                        this.logger.info('contentPrompt > getContentPromptHistoryByContentPromptId: content_prompt_history fetched successfully');
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`contentPrompt > getContentPromptHistoryByContentPromptId : content_prompt_history does not exist`);
                        return generateResponse(false, 'Not Found', 'content_prompt_history does not exist.');
                    }

                } catch (error) {
                    this.logger.info(`contentPrompt > getContentPromptHistoryByContentPromptId : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again');
                }
            }
        },
        searchContentPrompt: {
            auth: 'required',
            rest: {
                method: 'GET',
                path: '/searchContentPrompts'
            },
            async handler(ctx) {
                try {
                    const { prompt, type } = ctx.params.query;
                    const { user_id } = ctx.meta.user;

                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }

                    this.logger.info(`contentPrompt > searchContentPrompt : Service Starting`);

                    const searchCondition = {
                        user_id,
                        isActive: true,
                        // content_prompt_text: { [Sequelize.Op.iLike]: `%${prompt}%` },
                        link_title: { [Sequelize.Op.iLike]: `%${prompt}%` },
                    };

                    if (type === 'link' || type === 'attachment') {
                        searchCondition.content_prompt_type = type;
                    }

                    let response;

                    if (type === 'link') {
                        response = await findAndCountAll(this.db['content_prompt'], searchCondition, [['createdAt', 'desc']], {});
                        console.log('response', response)
                    } else {
                        response = await findAndCountAll(this.db['content_prompt'], searchCondition, [['createdAt', 'desc']], {});
                    }



                    const groupedData = response.rows.reduce((acc, item) => {
                        const date = item.createdAt.split('T')[0];
                        const existingDateIndex = acc.findIndex((group) => group.date === date);

                        if (existingDateIndex !== -1) {
                            acc[existingDateIndex].data.push(item);
                        } else {
                            acc.push({ date, data: [item] });
                        }
                        return acc;
                    }, []);

                    if (groupedData.length > 0) {
                        const resp = generateResponse(true, 'Content Prompts fetched Successfully', groupedData);
                        this.logger.info(`contentPrompt > searchContentPrompt: Prompts fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`contentPrompt > searchContentPrompt : No such similar prompt exists`);
                        return generateResponse(false, 'Not Found', 'No such similar prompt exists.');
                    }
                } catch (error) {
                    this.logger.info(`contentPrompt > searchContentPrompt : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again');
                }
            }

        },
        deleteContentPrompt: {
            auth: "required",
            rest: {
                method: "DELETE",
                path: "/deleteContentPrompt"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    const { user_id } = ctx.meta.user;

                    this.logger.info(`ContentPrompt > deleteContentPrompt : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = deleteContentPromptValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`ContentPrompt > deleteContentPrompt : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { promptId } = ctx.params.query;

                    const response = await updateRecords(this.db['content_prompt'], { isActive: false }, { user_id, content_prompt_id: promptId }, transaction);
                    if (response['recordsUpdated']) {
                        await updateRecords(this.db['content_prompt_history'], { isActive: false }, {  content_prompt_id: promptId }, transaction);
                            transaction.commit();
                            const resp = generateResponse(true, 'Chat Deleted Successfully');
                            this.logger.info(`deleteContentPrompt > deletedeleteContentPrompt : deleteContentPrompt Deleted Successfully ${JSON.stringify(response)}`);
                            return resp;
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in deleting Chat');
                    }
                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`deleteContentPrompt > deletedeleteContentPrompt : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        triggerLinkGraphChat: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerLinkGraph"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`contentPrompt > triggerLinkGraph : Service Starting`);
                    const validate = triggerContentValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { link, prompt_id } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    // const promptResponse = await findOne(this.db['contentPrompt'], { user_id, isActive: true, prompt_id });
                    // if (!promptResponse) {
                    //     this.logger.info(`contentPrompt > triggerLinkGraph : Prompt does not exist`);
                    //     ctx.meta.$statusCode = 409;
                    //     return generateResponse(false, 'Prompt does not exist')
                    // }

                    // Checking if user has active plan or not
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);

                    // if (!response) {
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = await generateResponse(true, 'No Active Plan Found');
                    //     this.logger.info(`contentPrompt > triggerLinkGraph: No Active Plan Found`);
                    //     transaction.rollback();
                    //     return resp;
                    // }

                    // Link graph generation — coming soon
                    transaction.rollback();
                    return generateResponse(false, 'Graph generation is not available yet.');

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`contentPrompt > triggerContentGraph : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        triggerAttachmentGraphChat: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerAttachmentGraph"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`contentPrompt > triggerAttachmentGraph : Service Starting`);
                    const validate = triggerAttachmentContentValidation.validate(ctx.params);
                    if (validate.error) {
                        transaction.rollback();
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { object_key, prompt_id } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    // Checking if user has active plan or not
                    const currentDate = moment().utc().format('YYYY-MM-DD');
                    const [response] = await rawQuery(this.db['sequelize'], `SELECT "user_plans"."user_plan_id","p".subsciption_type,"user_plans".credit_at_purchase , "user_plans".credits_used, "user_plans".expiry_date, "user_plans".plan_id, "user_plans"."updatedAt", "user_plans"."createdAt"  FROM "user_plans" AS "user_plans" join "plans" p on "user_plans".plan_id = p.plan_id WHERE "user_plans"."user_id" = '${user_id}' AND "user_plans"."isActive" = true and "p"."isActive" = true AND "user_plans"."expiry_date" > '${currentDate}' LIMIT 1`);

                    // if (!response) {
                    //     ctx.meta.$statusCode = 404;
                    //     const resp = await generateResponse(true, 'No Active Plan Found');
                    //     this.logger.info(`contentPrompt > triggerAttachmentGraph: No Active Plan Found`);
                    //     transaction.rollback();
                    //     return resp;
                    // }

                    // Attachment graph generation — coming soon
                    transaction.rollback();
                    return generateResponse(false, 'Graph generation is not available yet.');

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`contentPrompt > triggerAttachmentGraph : Internal Server Error : ${error}`);
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
        async updateData(user_id, link, response, tokens, text, transaction, exist, title) {
            try {
                // if (response.credit_at_purchase < (response.credits_used + (tokens / 1000))) {
                //     this.logger.info(`prompts > triggerContentPrompt : Credits Exhausted`);
                //     throw new Error('You have low credits! Please purchase a plan to continue accessing Frruit.');
                // }
                // await updateRecords(this.db['user_plans'], { credits_used: (response.credits_used + (exist ? tokens : (tokens / 1000))).toFixed(2) }, { user_plan_id: response.user_plan_id, plan_id: response.plan_id }, transaction);

                await create(this.db['credit_usage'], {
                    user_id,
                    plan_id: response.plan_id,
                    credit_used: exist ? tokens : (tokens / 1000).toFixed(2)
                }, transaction);

                const contentResponse = await create(this.db['content_prompt'], {
                    user_id,
                    content_prompt_type: "link",
                    content_prompt_text: link,
                    link_title: title,
                    creditUsed: exist ? tokens : Number((tokens / 1000).toFixed(2))
                }, transaction);

                await insertMany(this.db['content_prompt_history'], [
                    { user_id, content_prompt_id: contentResponse.content_prompt_id, person: 'user', text: link, type: 'link',render_type:'text' },
                    { user_id, content_prompt_id: contentResponse.content_prompt_id, person: 'bot', text: exist ? text : JSON.stringify(text), type: 'link',render_type:'text' }
                ], { transaction });

                return contentResponse;

            } catch (err) {
                throw err
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
