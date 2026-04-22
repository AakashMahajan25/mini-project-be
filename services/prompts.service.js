"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, findAndCountAll, rawQuery, insertMany } = require("../utils/postgresUtils");
const { generateResponse, getStartEndDate } = require("../utils/utility.js");
const { getPromptHistoryByPromptId, triggerChatValidation, addPromptsListValidation, deletePromptValidation } = require('../validation/promptsValidation');
const { buildSystemPrompt, chatCompletion } = require('../utils/openaiHelper');
const moment = require("moment");
const { Sequelize } = require("sequelize");
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "prompts",
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
        triggerChat: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerChat"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`prompts > triggerChat : Service Starting`);
                    const validate = triggerChatValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { message, prompt_id, market = "IN", flag } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    const promptResponse = await findOne(this.db['prompts'], { user_id, isActive: true, prompt_id });
                    if (!promptResponse) {
                        this.logger.info(`prompts > triggerChat : Prompt does not exist`);
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

                    // const updated_date = moment(response.updatedAt).format('YYYY-MM-DD');
                    // const currentUserDate = moment().format('YYYY-MM-DD');

                    // if(response?.subsciption_type === 'free'){
                    //     const {startDate, endDate} = await getStartEndDate(response?.createdAt);

                    //     const [monthlyCredits] = await rawQuery(this.db['sequelize'],`
                    //     SELECT SUM("credit_used") as total_credit_used
                    //         FROM "credit_usage"
                    //         WHERE "user_id" = ${user_id}
                    //         AND "plan_id" = ${response?.plan_id}
                    //         AND "createdAt" BETWEEN '${startDate}' AND '${endDate}'
                    //     `);

                    //     if (monthlyCredits && monthlyCredits?.total_credit_used !== null) {
                    //         const totalCreditUsed = parseFloat(monthlyCredits?.total_credit_used);
                    //         if (totalCreditUsed >= 50) {
                    //             ctx.meta.$statusCode = 400;
                    //             const resp = await generateResponse(true, 'Monthly Credit Exhausted');
                    //             this.logger.info(`prompts > triggerChat: Monthly Credit Exhausted`);
                    //             transaction.rollback();
                    //             return resp;
                    //         }
                    //     }
                    // }

                    // Reset the free count if plan is free and lastupdateddate is yesterday one
                    // if(response.subsciption_type === 'free' && updated_date !== currentUserDate){
                    //     // We will reset the free count
                    //     await updateRecords(this.db['user_plans'], { credits_used: 0 }, { user_plan_id: response.user_plan_id, plan_id: response.plan_id });
                    // }   

                    // Load last 10 messages for conversation context
                    const historyRows = await findAndCountAll(
                        this.db['prompt_history'],
                        { user_id, prompt_id, isActive: true },
                        [['prompt_history_id', 'ASC']],
                        {}
                    );
                    const historyMessages = (historyRows?.rows || []).slice(-10).map(row => ({
                        role: row.person === 'bot' ? 'assistant' : 'user',
                        content: row.text || ''
                    }));

                    const messages = [
                        { role: 'system', content: buildSystemPrompt(flag) },
                        ...historyMessages,
                        { role: 'user', content: message }
                    ];

                    try {
                        const aiResult = await chatCompletion(messages);

                        await create(this.db['credit_usage'], {
                            user_id,
                            plan_id: response?.plan_id,
                            credit_used: (aiResult.tokens / 1000).toFixed(2)
                        }, transaction);

                        await insertMany(this.db['prompt_history'], [
                            { user_id, prompt_id, person: 'user', text: message, type: 'text' },
                            { user_id, prompt_id, person: 'bot', text: aiResult.text, type: 'text', link: JSON.stringify([]), focus_type: flag }
                        ], { transaction });

                        transaction.commit();
                        this.logger.info(`prompts > triggerChat : Success`);
                        return generateResponse(true, 'Triggered Successfully', { data: aiResult.text, link: [], focus_type: flag });
                    } catch (aiError) {
                        transaction.rollback();
                        this.logger.info(`prompts > triggerChat : OpenAI Error : ${aiError}`);
                        ctx.meta.$statusCode = 500;
                        return generateResponse(false, aiError?.message || 'Something went wrong, Please try again');
                    }

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`prompts > triggerChat : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        triggerGraphChat: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/triggerGraph"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    this.logger.info(`prompts > triggerChat : Service Starting`);
                    const validate = triggerChatValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { message, prompt_id, market = "IN" } = ctx.params.body;
                    const { user_id } = ctx.meta.user;

                    const promptResponse = await findOne(this.db['prompts'], { user_id, isActive: true, prompt_id });
                    if (!promptResponse) {
                        this.logger.info(`prompts > triggerChat : Prompt does not exist`);
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

                    // Graph generation — coming soon
                    transaction.rollback();
                    return generateResponse(false, 'Graph generation is not available yet.');

                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`prompts > triggerChat : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        getPrompts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPrompts",
            },
            async handler(ctx) {
                try {
                    // const { query } = ctx.params;
                    const { user_id } = ctx.meta.user;
                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }

                    this.logger.info(`prompts > getPrompts : Service Starting`);

                    // const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
                    // const limit = (query.limit) ? query.limit : 10;
                    // const offset = page * limit - limit;

                    const response = await findAndCountAll(this.db['prompts'], { user_id: user_id, isActive: true }, [['createdAt', 'desc']], {});
                    // const response = await findAndCountAll(this.db['prompts'],{user_id : user_id, isActive : true}, null, {}, limit,page, offset);

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
                        const resp = generateResponse(true, 'prompts fetched successfully', groupedData);
                        this.logger.info(`prompts > getPrompts : prompts fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`prompts > getPrompts : prompts does not exist`);
                        return generateResponse(false, 'Not Found', 'prompts does not exist.');
                    }

                } catch (error) {
                    this.logger.info(`prompts > getPrompts : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        addPrompts: {
            auth: "required",
            rest: {
                method: "POST",
                path: "/addPrompts"
            },
            async handler(ctx) {
                try {
                    const { user_id } = ctx.meta.user;
                    const { prompt_text } = ctx.params.body;
                    this.logger.info(`prompts > addPrompts : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = addPromptsListValidation.validate({
                        body: {
                            user_id,
                            prompt_text
                        }
                    });
                    if (validate.error) {
                        this.logger.info(`prompts > addPrompts : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const message = prompt_text.substr(0, 320);
                    // const promptResponse = await findOne(this.db['prompts'], { user_id, isActive: true, prompt_text : message });
                    // if (promptResponse) {
                    //     this.logger.info(`prompts > addPrompts : Prompt already exist`);
                    //     // ctx.meta.$statusCode = 409;
                    //     return generateResponse(true, 'Prompt already exist', {prompt_id : promptResponse.prompt_id})
                    // }

                    const response = await create(this.db['prompts'], { user_id, prompt_text: message });
                    if (response) {
                        const resp = generateResponse(true, 'Prompts Added Successfully', { prompt_id: response.prompt_id });
                        this.logger.info(`prompts > addPrompts : Propmts Added Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in adding prompts');
                    }
                } catch (error) {
                    this.logger.info(`prompts > addPrompts : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        getPromptHistory: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/getPromptHistoryByPromptId",
            },
            async handler(ctx) {
                try {
                    this.logger.info(`prompt_history > getPromptHistoryByPromptId : Service Starting`);
                    const { query } = ctx.params;
                    const { user_id } = ctx.meta.user;
                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }

                    const validate = getPromptHistoryByPromptId.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`prompt_history > getPromptHistoryByPromptId : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    console.log('ctx.params', ctx.params)
                    // const page = (query.page) ? ((query.page === '0') ? 1 : query.page) : 1;
                    // const limit = (query.limit) ? query.limit : 10;
                    // const offset = page * limit - limit;

                    const { prompt_id } = ctx.params.query;

                    const response = await findAndCountAll(this.db['prompt_history'], { user_id: user_id, prompt_id: prompt_id, isActive: true }, [['prompt_history_id', 'ASC']], {});
                    // const response = await findAndCountAll(this.db['prompt_history'],{user_id : user_id,prompt_id : prompt_id, isActive : true}, null, {}, limit,page, offset);

                    if (response) {
                        const resp = generateResponse(true, 'prompt_history fetched successfully', response);
                        this.logger.info(`prompt_history > getPromptHistoryByPromptId : prompt_history fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`prompt_history > getPromptHistoryByPromptId : prompt_history does not exist`);
                        return generateResponse(false, 'Not Found', 'prompt_history does not exist.');
                    }

                } catch (error) {
                    this.logger.info(`prompt_history > getPromptHistoryByPromptId : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        searchPrompts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/searchPrompts",
            },
            async handler(ctx) {
                try {
                    const { prompt } = ctx.params.query;
                    const { user_id } = ctx.meta.user;
                    if (!user_id) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'user_id is required.');
                    }

                    this.logger.info(`prompts > searchPrompts : Service Starting`);

                    const response = await findAndCountAll(this.db['prompts'], {
                        user_id, isActive: true, prompt_text: {
                            [Sequelize.Op.iLike]: `%${prompt}%`,
                        }
                    }, [['createdAt', 'desc']], {});

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
                        const resp = generateResponse(true, 'Prompts fetched successfully', groupedData);
                        this.logger.info(`prompts > searchPrompts : Prompts fetched successfully`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 404;
                        this.logger.error(`prompts > searchPrompts : No such similar prompt exists`);
                        return generateResponse(false, 'Not Found', 'No such similar prompt exists.');
                    }

                } catch (error) {
                    this.logger.info(`prompts > searchPrompts : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },

        deletePrompt: {
            auth: "required",
            rest: {
                method: "DELETE",
                path: "/deletePrompt"
            },
            async handler(ctx) {
                const transaction = await this.db.sequelize.transaction();
                try {
                    const { user_id } = ctx.meta.user;

                    this.logger.info(`Prompt > deletePrompt : Service Starting ${JSON.stringify(ctx.params)}`);
                    const validate = deletePromptValidation.validate(ctx.params);
                    if (validate.error) {
                        this.logger.info(`Prompt > deletePrompt : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Validation Error', `${validate.error.message.replace(/\"/g, '')}`);
                    }

                    const { promptId } = ctx.params.query;

                    const response = await updateRecords(this.db['prompts'], { isActive: false }, { user_id, prompt_id: promptId }, transaction);
                    if (response['recordsUpdated']) {
                        await updateRecords(this.db['prompt_history'], { isActive: false }, {  prompt_id: promptId }, transaction);
                            transaction.commit();
                            const resp = generateResponse(true, 'Chat Deleted Successfully');
                            this.logger.info(`deletePrompt > deletedeletePrompt : deletePrompt Deleted Successfully ${JSON.stringify(response)}`);
                            return resp;
                    } else {
                        transaction.rollback();
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in deleting Chat');
                    }
                } catch (error) {
                    transaction.rollback();
                    this.logger.info(`deletePrompt > deletedeletePrompt : Internal Server Error : ${error}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, error?.message || 'Something went wrong, Please try again')
                }
            }
        },
        searchSuggestedQuestionPrompts: {
            auth: "required",
            rest: {
                method: "GET",
                path: "/searchSuggestedQuestionPrompts",
            },
            async handler(ctx) {
                try {
                    const { prompt } = ctx.params.query;
                    this.logger.info(`prompts > searchSuggestedQuestionPrompts : Service Starting`);

                    const response = await findAndCountAll(this.db['suggested_news_prompt'], {
                        isActive: true, question: {
                            [Sequelize.Op.iLike]: `%${prompt}%`,
                        }
                    }, [['createdAt', 'desc']], {});
                    if (response.count > 0) {
                        const resp = generateResponse(true, 'Prompts fetched successfully', response?.rows);
                        this.logger.info(`prompts > searchSuggestedQuestionPrompts : Prompts fetched successfully`);
                        return resp;
                    } else {
                        this.logger.info(`prompts > searchSuggestedQuestionPrompts : No such similar prompt exists`);
                        return generateResponse(true, 'Not Found', []);
                    }

                } catch (error) {
                    this.logger.info(`prompts > searchSuggestedQuestionPrompts : Internal Server Error : ${error}`);
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
