const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const getPromptHistoryByPromptId = joi.object({
  query: joi.object().keys({
    prompt_id: Joi.number().required().messages({
      'any.required': 'The prompt Id is required.',
      'number.empty': 'The prompt Id cannot be empty.',
    }),
    page: Joi.number().optional(),
    limit: Joi.number().optional()
  }).required()
}).unknown(true);

const triggerChatValidation = joi.object({
  body: joi.object().keys({
    prompt_id: Joi.number().required().messages({
      'any.required': 'The prompt Id is required.',
      'number.empty': 'The prompt Id cannot be empty.',
    }),
    message: Joi.string().required().messages({
      'any.required': 'The message is required.',
      'string.empty': 'The message cannot be empty.',
    }),
    market: Joi.string().valid('US', 'IN').default('IN').required().messages({
      'any.required': 'The market type is required.',
      'string.empty': 'The market type cannot be empty.',
      'any.only': 'The market type must be either "US" or "IN".',
    }),
    flag: Joi.string().optional(),
  }).required()
}).unknown(true);

const addPromptsListValidation = joi.object({
  body: joi.object().keys({
    prompt_text: Joi.string().required().messages({
      'any.required': 'The Prompt Text is required.',
      'string.empty': 'The Prompt Text cannot be empty.',
    }),
    user_id: Joi.string().required().messages({
      'any.required': 'The User id is required.',
      'string.empty': 'The User id cannot be empty.'
    }),
  }).required()
}).unknown(true);

const deletePromptValidation = joi.object({
	query: joi.object().keys({
		promptId: Joi.string().required().messages({
		'any.required': 'prompt Id is required.',
		'number.empty': 'prompt Id cannot be empty.',
	  }),
	}).required()
  }).unknown(true);

module.exports = Object.assign({}, {
  getPromptHistoryByPromptId,
  triggerChatValidation,
  addPromptsListValidation,
  deletePromptValidation
});