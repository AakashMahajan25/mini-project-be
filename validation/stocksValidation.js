const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const stockDetailsValidation = Joi.object({
    query: joi.object().keys({
        stocksTicker: Joi.string().required().messages({
            'any.required': 'Stocks ticker parameter is required. Please provide the stocksTicker parameter.',
        }),
        multiplier: Joi.number().required().messages({
            'any.required': 'Stocks multiplier parameter is required. Please provide the multiplier parameter.',
        }),
        timespan: Joi.string().valid('second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year').required().messages({
            'any.required': 'Timespan parameter is required. Please provide a timespan parameter (one of: second, minute, hour, day, week, month, quarter, year).',
        }),
        from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
                'any.required': 'from key is required. from must be in the YYYY-MM-DD format.',
                'string.pattern.base': 'from must be in the YYYY-MM-DD format.',
            }),
        to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
                'any.pattern.base': 'To must be in the YYYY-MM-DD format.',
                'string.required': 'to key must be in the YYYY-MM-DD format.',
            }),
        adjusted: Joi.bool().optional(),
        sort: Joi.string().valid('asc', 'desc').optional(),
        limit: Joi.number().optional(),
    }).required()
}).unknown(true);

const getStockBySearch = joi.object({
    query: joi.object().keys({
        keyword: joi.string().required().messages({
            'any.required': 'keyword is required. Please provide keyword parameter',
            'string.empty': 'keyword cannot be empty.'
        }),
    }).required()
}).unknown(true);

const getStockStatistics = joi.object({
query: joi.object().keys({
    symbol: joi.string().required().messages({
        'any.required': 'symbol is required. Please provide symbol parameter',
        'string.empty': 'symbol cannot be empty.'
    }),
}).required()
}).unknown(true);

const cocodeValidation = joi.object({
    query: joi.object().keys({
        cocode: joi.string().required().messages({
            'any.required': 'Co Code is required. Please provide Co Code parameter',
            'string.empty': 'Co Code cannot be empty.'
        }),
    }).required()
}).unknown(true);
    

module.exports = Object.assign({}, {
    stockDetailsValidation,
    getStockBySearch,
    getStockStatistics,
    cocodeValidation
});