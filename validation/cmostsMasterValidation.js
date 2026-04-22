const { Joi } = require("celebrate")
const extension = require("@hapi/joi-date")
const joi = Joi.extend(extension)
const exchangeValidation = Joi.object({
    query: Joi.object({
        exchange: Joi.string().valid('BSE', 'NSE').messages({
            'string.empty': 'The Exchange cannot be empty.',
            'any.only': 'The Exchange must be either "BSE" or "NSE".'
        }),
    })
}).unknown(true)
const sectorWiseCompanyValidation = Joi.object({
    query: Joi.object({
        sectorCode: Joi.number().messages({
            'any.required': 'The sector code is required.',
            'number.empty': 'The sector code cannot be empty.',
        }),
    })
}).unknown(true)
const indexwiseCompanyMasterValidation = Joi.object({
    query: Joi.object({
        indexCode: Joi.number().required().messages({
            'any.required': 'The index code  is required.',
            'number.empty': 'The index code  cannot be empty.',
        }),
    })
}).unknown(true)

const companyCodeValidation = Joi.object({
    query: Joi.object({
        cocode: Joi.number().required().messages({
            'any.required': 'The co code is required.',
            'number.empty': 'The co code cannot be empty.',
        }),
    })
}).unknown(true)
module.exports = Object.assign({},
    {
       exchangeValidation,
       companyCodeValidation,
        sectorWiseCompanyValidation,
        indexwiseCompanyMasterValidation,
    }
)