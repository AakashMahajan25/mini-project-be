const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const newsDetailsValidation = Joi.object({
    params: Joi.object({
        newsId: joi.string().required().messages({
            'any.required': 'newsId params is required. Please provide newsId parameter.',
        }),
    }).required(),
}).unknown(true);

const getCorporateNewsByCompanyIdValidation = Joi.object({
    query: Joi.object({
        companyId: joi.string().required().messages({
            'any.required': 'Company Id is required.',
        }),
        limit: joi.string().required().messages({
            'any.required': 'Limit is required.',
        }),
    }).required(),
}).unknown(true);

module.exports = Object.assign({}, {
    newsDetailsValidation,
    getCorporateNewsByCompanyIdValidation
});