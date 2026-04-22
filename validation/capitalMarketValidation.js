const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const getCapitalMarketNewsValidation = Joi.object({
    query: Joi.object({
        type: Joi.string().valid('hotPursuit', 'corporateNews', 'marketBeat', 'economyNews', 'corporateResults', 'stockAlert', 'preSession', 'midSession', 'endSession').required().messages({
            'any.required': 'The type field is required.',
            'string.empty': 'The type field cannot be empty.',
            'any.only': 'The type field must be either "hotPursuit", "corporateNews", "marketBeat", "economyNews", "corporateResults", "stockAlert", "preSession", "midSession", "endSession".',
        }),
    }).required(),
}).unknown(true);

module.exports = Object.assign({}, {
    getCapitalMarketNewsValidation,
});