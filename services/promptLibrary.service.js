"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const DbService = require("../mixins/db.mixin");
const { create, findOne, updateRecords, findAll, findAndCountAll, rawQuery, insertMany } = require("../utils/postgresUtils");
const { generateResponse, getStartEndDate } = require("../utils/utility.js");
// validation will be added here 
const moment = require("moment");
const { Sequelize } = require("sequelize");
const { addPromptLibraryValidation, getPromptByTypeValidation, deletPromptLibraryDeleteValidation, getPromptIdValidation, updatePromptLibraryValidation } = require('../validation/promptLibraryValidation.js');
require('dotenv').config();

/** @type {ServiceSchema} */
module.exports = {
    name: "promptlibrary",
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

        postPromptLibrary: {
            auth: true,
            rest: {
                method: "POST",
                path: "/addPromptTextLibrary"
            },
            async handler(ctx) {
                try {
                    // const { isAdmin } = ctx.meta.user;

                    // if (!isAdmin) {
                    //     ctx.meta.$statusCode = 403; 
                    //     return generateResponse(false, "You are not authorized to post the prompt library");
                    // }

                    const { prompt_text, type } = ctx.params.body;

                    const validationResult = addPromptLibraryValidation.validate({
                        body: {
                            type, prompt_text
                        }
                    });
                    if (validationResult.error) {
                        this.logger.info(` > fetch promptlibrary: Validation Error : ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const prompt_library_details = {
                        prompt_text: prompt_text,
                        type: type
                    };
                    const existingPrompt = await this.db['prompt_library'].findOne({ where: { prompt_text, type } });
                    if (existingPrompt) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Prompt text already exists with the same type');
                    }
                    const response = await create(this.db['prompt_library'], prompt_library_details);

                    if (response) {
                        const resp = generateResponse(true, 'Prompts Added Successfully', { prompt_library_id: response.prompt_library_id });
                        this.logger.info(`prompts > addPrompts : Propmts Added Successfully ${JSON.stringify(response)}`);
                        return resp;
                    } else {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, 'Error in adding prompts');
                    }
                } catch (error) {
                    this.logger.error(`Error creating prompt library entry: ${error.message}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, "Internal server error");
                }
            }
        },

        getAllPromptByFilter: {
            auth: true,
            rest: {
                method: "GET",
                path: "/getPrompts"
            },
            async handler(ctx) {
                try {
                    const { type, prompt_library_id } = ctx.params.query;

                    if (prompt_library_id) {
                        const validationResult = getPromptIdValidation.validate({
                            params: { prompt_library_id }
                        });

                        if (validationResult.error) {
                            this.logger.info(`Validation Error: ${validationResult.error.message.replace(/\"/g, '')}`);
                            ctx.meta.$statusCode = 400;
                            return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                        }

                        const promptLibraryModel = this.db['prompt_library'];

                        const promptData = await promptLibraryModel.findOne({
                            where: { prompt_library_id: prompt_library_id }
                        });

                        if (promptData) {
                            this.logger.info(`Entity > getPromptById: Prompt with ID ${prompt_library_id} fetched successfully: ${JSON.stringify(promptData)}`);
                            return generateResponse(true, 'Prompt fetched successfully', promptData);
                        } else {
                            this.logger.info(`Entity > getPromptById: Prompt with ID ${prompt_library_id} not found`);
                            return generateResponse(false, 'Prompt not found');
                        }
                    } else if (type) {
                        const validationResult = getPromptByTypeValidation.validate({
                            params: { type }
                        });

                        if (validationResult.error) {
                            this.logger.info(`Validation Error: ${validationResult.error.message.replace(/\"/g, '')}`);
                            ctx.meta.$statusCode = 400;
                            return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                        }

                        const prompts = await this.db['prompt_library'].findAll({ where: { type } });

                        if (prompts.length > 0) {
                            return generateResponse(true, 'Prompts Fetched Successfully', { prompts });
                        } else {
                            return generateResponse(false, 'No prompts found with the specified type');
                        }
                    } else {
                        const promptLibraryModel = this.db['prompt_library'];

                        const prompts = await promptLibraryModel.findAll({ where: { isActive: true } });

                        return generateResponse(true, 'All prompts Fetched Successfully', { prompts });
                    }
                } catch (error) {
                    this.logger.error(`Internal Server Error: ${error.message}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, "Internal server error");
                }
            }
        },

        deletePromptByPromptText: {
            auth: true,
            rest: {
                method: "DELETE",
                path: "/deletePromptText"
            },
            async handler(ctx) {
                try {
                    const { prompt_library_id } = ctx.params.query;

                    const validationResult = deletPromptLibraryDeleteValidation.validate({
                        params: { prompt_library_id }
                    });

                    if (validationResult.error) {
                        this.logger.info(`Validation Error: ${validationResult.error.message.replace(/\"/g, '')}`);
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `${validationResult.error.message.replace(/\"/g, '')}`);
                    }

                    const promptLibraryModel = this.db['prompt_library'];

                    const updatedCount = await promptLibraryModel.update(
                        { isActive: false },
                        { where: { prompt_library_id } }
                    );

                    if (updatedCount > 0) {
                        return generateResponse(true, 'Prompt Deleted Successfully');
                    } else {
                        return generateResponse(false, 'Prompt not found or already deleted');
                    }
                } catch (error) {
                    this.logger.error(`Internal Server Error: ${error.message}`);
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, "Internal server error");
                }
            }
        },
        
        updatePromptLibraryTextById: {
            auth: true,
            rest: {
                method: "PUT",
                path: "/updatePromptLibrary"
            },
            async handler(ctx) {
                try {
                    const { prompt_library_id } = ctx.params.query;
                    const { prompt_text, type } = ctx.params.body;

                    // Validate input
                    const validationResult = updatePromptLibraryValidation.validate({
                        params: { prompt_library_id },
                        body: { prompt_text, type }
                    });

                    if (validationResult.error) {
                        ctx.meta.$statusCode = 400;
                        return generateResponse(false, `Validation Error: ${validationResult.error.message.replace(/\"/g, '')}`);
                    }
                    const [updatedRowsCount] = await this.db['prompt_library'].update(
                        { prompt_text, type },
                        { where: { prompt_library_id: prompt_library_id } }
                    );
                    if (updatedRowsCount > 0) {
                        return generateResponse(true, 'Prompt Updated Successfully');
                    } else {
                        return generateResponse(false, 'Prompt not found or could not be updated');
                    }
                } catch (error) {
                    ctx.meta.$statusCode = 500;
                    return generateResponse(false, `Internal Server Error: ${error.message}`);
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
