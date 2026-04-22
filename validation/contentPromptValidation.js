const { Joi } = require("celebrate")
const extension = require("@hapi/joi-date")
const joi = Joi.extend(extension)

const linkAndAttchmentValidation = Joi.object({
	body: Joi.object({
		link: Joi.string().required().messages({
			'any.required': 'The Link is required.',
			'string.empty': 'The Link cannot be empty.',
		}),
	})
}).unknown(true)

const signedURLValidation = joi.object({
	query: Joi.object({
		fileName: joi.string().required().messages({
			"any.required": "The file name is required.",
			"string.empty": "The file name field cannot be empty.",
		}),
		fileType: joi.string().required().messages({
			"any.required": "The file type is required.",
			"string.empty": "The file type field cannot be empty.",
		})
	}).required(),
}).unknown(true);

const addDocumentValidation = joi.object({
	body: Joi.object({
		object_key: joi.string().required().messages({
			"any.required": "The document path is required.",
			"string.empty": "The document path cannot be empty.",
		}),
	}).required(),
}).unknown(true);

const triggerDocumentChatValidation = Joi.object({
	body: Joi.object({
		prompt_id: Joi.number().required().messages({
			'any.required': 'The prompt Id is required.',
			'number.empty': 'The prompt Id cannot be empty.',
		}),
		message: Joi.string().required().messages({
			'any.required': 'The message is required.',
			'string.empty': 'The message cannot be empty.',
		}),
	})
}).unknown(true)

const getContentPromptHistoryByPromptId = joi.object({
	query: joi.object().keys({
		content_prompt_id: Joi.number().required().messages({
			'any.required': 'The prompt Id is required.',
			'number.empty': 'The prompt Id cannot be empty.',
		}),
		page: Joi.number().optional(),
		limit: Joi.number().optional()
	}).required()
}).unknown(true);

const deleteContentPromptValidation = joi.object({
	query: joi.object().keys({
		promptId: Joi.string().required().messages({
		'any.required': 'prompt Id is required.',
		'number.empty': 'prompt Id cannot be empty.',
	  }),
	}).required()
  }).unknown(true);

  const triggerContentValidation = joi.object({
	body: joi.object().keys({
	prompt_id: Joi.number().required().messages({
		'any.required': 'The prompt Id is required.',
		'number.empty': 'The prompt Id cannot be empty.',
	  }),
	  link: Joi.string().required().messages({
		'any.required': 'The Link is required.',
		'string.empty': 'The Link cannot be empty.',
	  }),
	}).required()
  }).unknown(true);

  const triggerAttachmentContentValidation = joi.object({
	body: joi.object().keys({
	prompt_id: Joi.number().required().messages({
		'any.required': 'The prompt Id is required.',
		'number.empty': 'The prompt Id cannot be empty.',
	  }),
	  object_key: Joi.string().required().messages({
		'any.required': 'The object_key is required.',
		'string.empty': 'The object_key cannot be empty.',
	  }),
	}).required()
  }).unknown(true);


module.exports = Object.assign({},
	{
		linkAndAttchmentValidation,
		signedURLValidation,
		addDocumentValidation,
		triggerDocumentChatValidation,
		getContentPromptHistoryByPromptId,
		deleteContentPromptValidation,
		triggerContentValidation,
		triggerAttachmentContentValidation
	}
)
