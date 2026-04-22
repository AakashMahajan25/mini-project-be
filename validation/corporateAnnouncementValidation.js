const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const cocodeValidation = Joi.object({
    query: Joi.object({
        cocode: Joi.string().required().messages({
            'any.required': 'cocode Id is required.',
            'number.empty': 'cocode Id cannot be empty.',
        }),
    }).required(),
}).unknown(true);

const fetchNameChangeValidation = Joi.object({
    query: Joi.object({
        alpha : Joi.string().optional().messages({
            'any.required': 'Alpha is required.',
            'string.empty': 'Alpha cannot be empty.',
        }),
    }).required(),
}).unknown(true);

const eventCountValidation = Joi.object({
    query: Joi.object({
        month: Joi.string().regex(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i).required().messages({
            'string.pattern.base': 'Month must be a valid three-letter abbreviation of a month (e.g., jan, feb, ..., dec).',
            'any.required': 'Month is required.',
        }),
        year: Joi.string().regex(/^\d{4}$/).required().messages({
            'string.pattern.base': 'Year must be a valid four-digit year (e.g., 2022).',
            'any.required': 'Year is required.',
        }),
    })
}).unknown(true);

const eventDetailsValidation = Joi.object({
    query: Joi.object({
        date: Joi.string().regex(/^\d{2}-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-\d{4}$/i).required().messages({
            'string.pattern.base': 'Date must be in the format "DD-MMM-YYYY" (e.g., 22-Sep-2021).',
            'any.required': 'date is required.',
        }),
        corpType: Joi.string().valid("bonus", "split", "dividend", "bookcloser", "buyback", "result").required().messages({
            'string.base': 'corpType must be a string.',
            'any.required': 'corpType is required.',
            'any.only': 'corpType must be one of "bonus", "split", "dividend", "bookcloser", "buyback", or "result".',
        }),
        fetchRecordCount: Joi.number().required().messages({
            'number.base': 'fetchRecordCount must be a number.',
            'any.required': 'fetchRecordCount is required.',
        }),
    })
}).unknown(true);

const eventDetailsMonthlyValidation = Joi.object({
    query: Joi.object({
        corpType: Joi.string().valid("bonus", "split", "dividend", "bookcloser", "buyback", "result").required().messages({
            'string.base': 'corpType must be a string.',
            'any.required': 'corpType is required.',
            'any.only': 'corpType must be one of "bonus", "split", "dividend", "bookcloser", "buyback", or "result".',
        }),
        limit: Joi.number().required().messages({
            'number.base': 'limit must be a number.',
            'any.required': 'limit is required.',
        }),
    })
}).unknown(true);

const eventCountDateWiseValidation = Joi.object({
    query: Joi.object({
        date: Joi.string().regex(/^\d{2}-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-\d{4}$/i).required().messages({
            'string.pattern.base': 'Date must be in the format "DD-MMM-YYYY" (e.g., 22-Sep-2021).',
            'any.required': 'date is required.',
        }),
    })
}).unknown(true);

module.exports = Object.assign({}, {
    cocodeValidation,
    fetchNameChangeValidation,
    eventCountValidation,
    eventDetailsValidation,
    eventDetailsMonthlyValidation,
    eventCountDateWiseValidation
});