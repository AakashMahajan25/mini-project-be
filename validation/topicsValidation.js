const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const searchTopicsValidation = Joi.object({
    query: Joi.object({
        keyword: joi.string().required().messages({
            'any.required': 'keyword is required. Please provide keyword parameter.',
        }),
    }).required(),
}).unknown(true);

const getTopicsByUserIdValidation = Joi.object({
    query: Joi.object({
        user_id: joi.string().required().messages({
            'any.required': 'user_id is required. authentication required.',
        }),
    }).required(),
}).unknown(true);

module.exports = Object.assign({}, {
    searchTopicsValidation,
    getTopicsByUserIdValidation
});