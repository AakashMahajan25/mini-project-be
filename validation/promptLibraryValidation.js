const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const getPromptLibraryByPromptId = joi.object({
    query: joi.object().keys({
      prompt_id: Joi.number().required().messages({
        'any.required': 'The prompt Id is required.',
        'number.empty': 'The prompt Id cannot be empty.',
      }),
      page: Joi.number().optional(),
      limit: Joi.number().optional()
    }).required()
  }).unknown(true);

  const addPromptLibraryValidation = Joi.object({
    body: Joi.object().keys({
      prompt_text: Joi.string().required().messages({
        'any.required': 'The Prompt Text is required.',
        'string.empty': 'The Prompt Text cannot be empty.',
      }),
      type: Joi.string().required().messages({
        "any.required": "Prompt type is required.",
        "string.empty": "Prompt type cannot be empty."
    }),
    }).required()
  }).unknown(true);
  
  const deletPromptLibraryDeleteValidation=joi.object({
    params: Joi.object().keys({
      prompt_library_id: Joi.string().required().messages({
          'any.required': 'The Prompt Id is required.',
          'number.empty': 'The Prompt Id cannot be empty.',
        }),
      }).required()
  }).unknown(true);
  const getPromptByTypeValidation = Joi.object({
    params: Joi.object().keys({
      type: Joi.string().valid('popular', 'suggested').required().messages({
        'any.required': 'The Prompt Id is required.',
        'string.empty': 'The type cannot be empty.',
        'any.only': 'The type must be either "popular" or "suggested".'
      }),
    }).required()
  }).unknown(true);
  const getPromptIdValidation=joi.object({
    params: Joi.object().keys({
      prompt_library_id: Joi.string().required().messages({
          'number.empty': 'The  id cannot be empty.',
          "any.required": "prompt id  is required.",
        }),
      }).required()
  }).unknown(true);

  const updatePromptLibraryValidation = Joi.object({
    params: Joi.object().keys({
      prompt_library_id: Joi.string().required().messages({
            'any.required': 'The prompt ID is required.',
            'number.empty': 'The prompt ID cannot be empty.',
        }),
    }),
    body: Joi.object().keys({
        prompt_text: Joi.string().required().messages({
            'any.required': 'The prompt text is required.',
            'string.empty': 'The prompt text cannot be empty.',
        }),
        type: Joi.string().valid('popular', 'suggested').required().messages({
          'any.required': 'The prompt type is required.',
          'string.empty': 'The prompt type cannot be empty.',
          'any.only': 'The type must be either "popular" or "suggested".'
        }),
    }).required()
}).unknown(true);



  module.exports = Object.assign({}, {
    addPromptLibraryValidation,
   getPromptLibraryByPromptId,
   deletPromptLibraryDeleteValidation,
   getPromptByTypeValidation,
   getPromptIdValidation,
   updatePromptLibraryValidation
  });