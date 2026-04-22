const { Joi } = require("celebrate")
const extension = require("@hapi/joi-date")
const joi = Joi.extend(extension)

const quarterlyResultsValidation = Joi.object({
    params: Joi.object({
        cocode: Joi.number().integer().required().messages({
            'any.required': 'Cocode parameter is required.',
            'number.base': 'Cocode must be a number.',
            'number.integer': 'Cocode must be an integer.'
        }),
        type: Joi.string().valid('S', 'C').required().messages({
            'any.required': 'Type parameter is required.',
            'string.base': 'Type must be a string.',
            'any.only': 'Type must be either "S" or "C".'
        })
    }).required().messages({
        'any.required': 'Parameters are required.'
    })
}).unknown(true);

const shareHoldingPatternValidation = Joi.object({
    params: Joi.object({
        cocode: Joi.number().integer().required().messages({
            'any.required': 'Cocode parameter is required.',
            'number.base': 'Cocode must be a number.',
            'number.integer': 'Cocode must be an integer.'
        })
    }).required().messages({
        'any.required': 'Parameters are required.'
    })
}).unknown(true);

module.exports = { quarterlyResultsValidation, shareHoldingPatternValidation };
