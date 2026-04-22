const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const userSignUpValidation = joi.object({
  body: joi.object().keys({
    first_name: joi.string().required().messages({
      'any.required': 'First name is required. Please provide a first name.',
    }),
    last_name: joi.string().required().messages({
      'any.required': 'Last name is required. Please provide a last name.',
    }),
    phone_number: Joi.string()
      .pattern(/^\+[1-9]\d{1,14}$/) // Regular expression for country code and number
      .optional().messages({
        'string.pattern.base': 'Phone number must start with "+" and contain between 1 to 15 digits.',
        "string.string": "phone_number must be an integer."
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Specify that TLDs are not allowed if needed
      .required()
      .messages({
        'string.email': 'Invalid email format. Please provide a valid email address.',
        'any.required': 'Email is required. Please provide an email address.',
      }),
    country: joi.string().required().messages({
      'any.required': 'Country is required. Please provide a country.',
    }),
    broker: joi.string().optional(),
  })
}).unknown(true);

const userUpdateValidation = joi.object({
  body: joi.object().keys({
    first_name: Joi.string().optional().messages({
      'string.empty': 'First name cannot be empty.',
    }),
    last_name: Joi.string().optional().messages({
      'string.empty': 'Last name cannot be empty.',
    }),
    phone_number: Joi.string()
      .pattern(/^\+[1-9]\d{1,14}$/) // Regular expression for country code and number
      .optional().messages({
        'string.empty': 'Phone Number cannot be empty.',
        'string.pattern.base': 'Phone number must start with "+" and contain between 1 to 15 digits.',
        "string.string": "Phone Number must be an integer."
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Specify that TLDs are not allowed if needed
      .optional()
      .messages({
        'string.email': 'Invalid email format. Please provide a valid email address.',
        'any.required': 'Email is required. Please provide an email address.',
      }),
    address: Joi.string().optional().messages({
      'string.empty': 'Address cannot be empty.',
    }),
  })
}).unknown(true);

const generateOtpValidation = joi.object({
  body: joi.object({
    type: Joi.string().valid('mobile', 'email').optional().messages({
      'string.empty': 'The type field cannot be empty.',
      'any.only': 'The type field must be either "mobile" or "email".',
    }),
    mobile: Joi.when('type', {
      is: 'mobile',
      then: Joi.string()
        .required()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .messages({
          'any.required': 'The mobile field is required.',
          'string.pattern.base': 'Phone number must start with "+" and contain between 1 to 15 digits.',
          'string.empty': 'The mobile field cannot be empty.',
        }),
    }),
    email: Joi.when('type', {
      is: 'email',
      then: Joi.string()
        .email()
        .required()
        .messages({
          'any.required': 'The email field is required.',
          'string.empty': 'The email field cannot be empty.',
          'string.email': 'The email field must be a valid email address.',
        }),
    })
  }),
}).unknown(true);

const verifyOtpValidation = joi.object({
  body: joi.object({
    type: Joi.string().valid('mobile', 'email').required().messages({
      'any.required': 'The type field is required.',
      'string.empty': 'The type field cannot be empty.',
      'any.only': 'The type field must be either "mobile" or "email".',
    }),
    mobile: Joi.when('type', {
      is: 'mobile',
      then: joi.string().pattern(/^\+[1-9]\d{1,14}$/)
        .required()
        .messages({
          'any.required': 'The mobile field is required.',
          'string.pattern.base': 'Phone number must start with "+" and contain between 1 to 15 digits.',
          'string.empty': 'The mobile field cannot be empty.',
        }),
      otherwise: joi.string().optional()
    }),
    email: Joi.when('type', {
      is: 'email',
      then: Joi.string()
        .email()
        .required()
        .messages({
          'any.required': 'The email field is required.',
          'string.empty': 'The email field cannot be empty.',
          'string.email': 'The email field must be a valid email address.',
        }),
      otherwise: joi.string().optional()
    }),
    otp: Joi.number().required().messages({
      'any.required': 'OTP is required.',
      'string.empty': 'OTP be empty.',
    }),
  }),
}).unknown(true);

const resendOtpValidation = joi.object({
  body: joi.object({
    type: Joi.string().valid('mobile', 'email').required().messages({
      'any.required': 'The type field is required.',
      'string.empty': 'The type field cannot be empty.',
      'any.only': 'The type field must be either "mobile" or "email".',
    }),
    mobile: Joi.when('type', {
      is: 'mobile',
      then: joi.string().pattern(/^\+[1-9]\d{1,14}$/)
        .required()
        .messages({
          'any.required': 'The mobile field is required.',
          'string.pattern.base': 'Phone number must start with "+" and contain between 1 to 15 digits.',
          'string.empty': 'The mobile field cannot be empty.',
        }),
      otherwise: joi.string().optional()
    }),
    email: Joi.when('type', {
      is: 'email',
      then: Joi.string()
        .email()
        .required()
        .messages({
          'any.required': 'The email field is required.',
          'string.empty': 'The email field cannot be empty.',
          'string.email': 'The email field must be a valid email address.',
        }),
      otherwise: joi.string().optional()
    })
  }),
}).unknown(true);

const fetchUserValidation = Joi.object({
  params: Joi.object({
    userId: joi.string().required().messages({
      'any.required': 'userId is required. Please provide userId.',
    }),
  }).required(),
}).unknown(true);

const addUserTopicsValidation = joi.object({
  query: Joi.object({
    user_id: joi.string().required().messages({
      'any.required': 'user_id is required. authentication required.',
    }),
  }).required(),
  body: joi.object({
    topic_id: joi.array()
      .items(joi.number().integer())
      .min(1)
      .required()
      .messages({
        'any.required': 'The topic_id field is required.',
        'array.min': 'At least one topic_id must be provided.',
        'array.base': 'The topic_id field must be an array of numbers.',
        'number.base': 'Each item in topic_id must be a number.'
      })
  }),
}).unknown(true);

const eventIdValidation = joi.object({
  query: Joi.object({
    event_id: joi.number().required().messages({
      'any.required': 'event_id is required.',
      'number.base': 'event_id is required.'
    }),
  }).required(),
}).unknown(true);

const fetchAllDetailsBasedOnCompanyValidation = joi.object({
  query: Joi.object({
    company_id: joi.number().required().messages({
      'any.required': 'Company Id is required.',
      'number.base': 'Company Id is required.'
    }),
    date : Joi.string().required()
    .pattern(new RegExp(/^\d{4}-\d{2}-\d{2}$/))
    .messages({
      'any.required': 'Date is required.',
        'string.pattern.base': 'Date From must be in the format yyyy-mm-dd.'
    })
  }).required(),
}).unknown(true);

const generateAdminOtpValidation = joi.object({
  body: joi.object({
    email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format. Please provide a valid email address.',
      'any.required': 'Email is required. Please provide an email address.',
    }),
  }),
}).unknown(true);

const userFeedbackValidation = joi.object({
  body: joi.object({
    user_id: Joi.number().required().messages({
      'any.required': 'User Id is required.',
      'number.base': 'User Id is required.'
    }),
    title: Joi.string().required().messages({
      'any.required': 'Title is required.',
      'string.base': 'Title is required.'
    }),
    notes: Joi.string().required().messages({
      'any.required':  'Notes is required.',
      'string.base': 'Notes is required.'
    }),
    attachment: Joi.string().required().messages({
      'any.required':  'Attachment is required.',
      'string.base': 'Attachment is required.'
    }),
  }),
}).unknown(true);

// Email-based login validation
const emailLoginOtpValidation = joi.object({
  body: joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Invalid email format. Please provide a valid email address.',
        'any.required': 'Email is required. Please provide an email address.',
      }),
  }),
}).unknown(true);

// Email-based OTP verification for login
const emailLoginVerifyOtpValidation = joi.object({
  body: joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Invalid email format. Please provide a valid email address.',
        'any.required': 'Email is required. Please provide an email address.',
      }),
    otp: Joi.number().required().messages({
      'any.required': 'OTP is required.',
      'number.base': 'OTP must be a number.',
    }),
  }),
}).unknown(true);

module.exports = Object.assign({}, {
  userSignUpValidation,
  userUpdateValidation,
  generateOtpValidation,
  verifyOtpValidation,
  fetchUserValidation,
  addUserTopicsValidation,
  eventIdValidation,
  fetchAllDetailsBasedOnCompanyValidation,
  generateAdminOtpValidation,
  resendOtpValidation,
  userFeedbackValidation,
  emailLoginOtpValidation,
  emailLoginVerifyOtpValidation
});