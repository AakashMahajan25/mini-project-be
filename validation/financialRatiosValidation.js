const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const financialRatiosGeneralValidation = Joi.object({
    query: joi.object().keys({
        companyCode: Joi.string().required().messages({
            'any.required': 'Company Code is required.',
            'string.empty': 'Company Code cannot be empty.',
        }),
        type: Joi.string().valid('S', 'C').required().messages({
            'any.required': 'The type field is required.',
            'string.empty': 'The type field cannot be empty.',
            'any.only': 'The type field must be either "S" or "C".',
        })
    })
}).unknown(true);

module.exports = Object.assign({}, {
    financialRatiosGeneralValidation
});