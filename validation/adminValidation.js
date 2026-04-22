const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const getTotalUsersValidation = joi.object({
    query: joi.object({
        startDate: joi.string()
            .optional()
            .pattern(new RegExp(/^\d{4}-\d{2}-\d{2}$/))
            .messages({
                'string.empty': 'Start Date cannot be empty.',
                'string.pattern.base': 'Start Date must be in the format YYYY-MM-DD.'
            }),
        endDate: joi.string()
        .optional()
        .pattern(new RegExp(/^\d{4}-\d{2}-\d{2}$/))
        .messages({
            'string.empty': 'End Date cannot be empty.',
            'string.pattern.base': 'Start Date must be in the format YYYY-MM-DD.'
        }),
    }),
}).unknown(true);

const activeDeactiveUserValidation = Joi.object({
    query: Joi.object({
        isActive: Joi.string()
            .required() 
            .messages({
                'string.empty': 'isActive cannot be empty.',
                'any.required': 'isActive is a required field.'
            }),
        userId: Joi.string()
            .required() 
            .messages({
                'string.empty': 'User Id cannot be empty.',
                'any.required': 'User Id is a required field.'
            }),
    }),
}).unknown(true);

const createAndUpdatePlanValidation = Joi.object({
    body: Joi.object({
        plan_id: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Plan Id cannot be empty.',
        }),
        plan_name: Joi.string()
            .required()
            .messages({
                'string.empty': 'Plan Name cannot be empty.',
                'any.required': 'Plan Name is a required field.'
            }),
        plan_type: Joi.string()
            .required().valid('topup', 'plan')
            .messages({
                'string.empty': 'Plan Type cannot be empty.',
                'any.required': 'Plan Type is a required field.',
                'any.only': 'The type field must be either "topup", "plan".',
            }),
        subsciption_type: Joi.string()
            .required().valid('free', 'paid')
            .messages({
                'string.empty': 'Subsciption Type cannot be empty.',
                'any.required': 'Subsciption Type is a required field.',
                'any.only': 'The type field must be either "free", "paid".',
            }),
        description: Joi.string()
            .required()
            .messages({
                'string.empty': 'Description cannot be empty.',
                'any.required': 'Description is a required field.'
            }),
        highlights: Joi.string()
            .required()
            .messages({
                'string.empty': 'Highlights cannot be empty.',
                'any.required': 'Highlights is a required field.'
            }),
        credits_offered: Joi.string()
            .required()
            .messages({
                'string.empty': 'Credits Offered cannot be empty.',
                'any.required': 'Credits Offered is a required field.'
            }),
        price: Joi.number()
            .required()
            .messages({
                'string.empty': 'Price cannot be empty.',
                'any.required': 'Price is a required field.'
            }),
        validity: Joi.number()
            .required()
            .messages({
                'string.empty': 'Validity cannot be empty.',
                'any.required': 'Validity is a required field.'
            }),
    }),
}).unknown(true);

const getPlanDetailsValidation = Joi.object({
    params: Joi.object({
        plan_id: Joi.string()
        .required()
        .messages({
            'string.empty': 'Plan Id cannot be empty.',
            'string.empty': 'Plan Id cannot be empty.',
        }),
    }),
}).unknown(true);

const paginationValidation = joi.object({
    query: joi.object().keys({
        limit: Joi.number().allow('').optional(),
        page: Joi.number().allow('').optional(),
    })
}).unknown(true);

const getPromptAdminValidation = joi.object({
    query: joi.object().keys({
        startDate: joi.string()
            .optional()
            .pattern(new RegExp(/^\d{4}-\d{2}-\d{2}$/))
            .messages({
                'string.empty': 'Start Date cannot be empty.',
                'string.pattern.base': 'Start Date must be in the format YYYY-MM-DD.'
            }),
        endDate: joi.string()
            .optional()
            .pattern(new RegExp(/^\d{4}-\d{2}-\d{2}$/))
            .messages({
                'string.empty': 'End Date cannot be empty.',
                'string.pattern.base': 'Start Date must be in the format YYYY-MM-DD.'
            }),
        limit: Joi.number().allow('').optional(),
        page: Joi.number().allow('').optional(),
    })
}).unknown(true);

const getPromptHistoryAdminValidation = joi.object({
    query: joi.object().keys({
        prompt_id: Joi.string()
        .required()
        .messages({
            'string.empty': 'Prompt Id cannot be empty.',
            'any.required': 'Prompt Id cannot be empty.',
        }),
    })
}).unknown(true);

module.exports = Object.assign({}, {
    getTotalUsersValidation,
    activeDeactiveUserValidation,
    createAndUpdatePlanValidation,
    paginationValidation,
    getPlanDetailsValidation,
    getPromptHistoryAdminValidation,
    getPromptAdminValidation
});