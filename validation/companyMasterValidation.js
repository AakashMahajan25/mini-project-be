const { Joi } = require("celebrate")
const extension = require("@hapi/joi-date")
const joi = Joi.extend(extension)

const getCompanyProfileValidation = joi.object({
	query: joi.object().keys({
		cocode: Joi.string().required().messages({
			'any.required': 'cocode is required.',
			'number.empty': 'cocode cannot be empty.',
		}),
	}).required()
}).unknown(true);

const getCapitalStructureValidation = joi.object({
	query: joi.object().keys({
		cocode: Joi.string().required().messages({
			'any.required': 'cocode is required.',
			'number.empty': 'cocode cannot be empty.',
		}),
		count: Joi.string().required().messages({
			'any.required': 'count is required.',
			'string.empty': 'count cannot be empty.',
		}),
	}).required()
}).unknown(true);

module.exports = Object.assign({},
	{
		getCompanyProfileValidation,
		getCapitalStructureValidation
	}
)
