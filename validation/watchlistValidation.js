const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const deleteWatchListValidation = joi.object({
  query: joi.object().keys({
    watchListId: Joi.string().required().messages({
      'any.required': 'Watchlist Id is required.',
      'number.empty': 'Watchlist Id cannot be empty.',
    }),
  }).required()
}).unknown(true);

const editWatchListValidation = joi.object({
  query: joi.object().keys({
    watchListId: Joi.string().required().messages({
      'any.required': 'Watchlist Id is required.',
      'number.empty': 'Watchlist Id cannot be empty.',
    }),
  }).required(),
  body: joi.object({
    watchlist_name: Joi.string().required().messages({
      'any.required': 'Watchlist Name is required.',
      'string.empty': 'Watchlist Name cannot be empty.'
    })
  }),
}).unknown(true);

const addWatchListValidation = joi.object({
  body: joi.object({
    watchlist_name: Joi.string().required().messages({
      'any.required': 'Watchlist Name is required.',
      'string.empty': 'Watchlist Name cannot be empty.'
    })
  }),
}).unknown(true);

const addTickertoWatchListValidation = joi.object({
  params: joi.object({
    ticker: Joi.string().required().messages({
      'any.required': 'Ticker is required.',
      'string.empty': 'Ticker cannot be empty.'
    }),
    watchlist_id: Joi.number().required().messages({
        'any.required': 'The Watchlist Id is required.',
        'number.empty': 'The Watchlist Id cannot be empty.',
      }),
    ticker_name: Joi.string().required().messages({
      'any.required': 'Ticker Name is required.',
      'string.empty': 'Ticker Name cannot be empty.'
    }),
    cocode: Joi.number().required().messages({
      'any.required': 'Cocode is required.',
      'number.empty': 'Cocode cannot be empty.'
    }),
    // ticker_price: Joi.number().required().messages({
    //   'any.required': 'The Ticker Price is required.',
    //   'number.empty': 'The Ticker Price cannot be empty.',
    // }),
    // ticker_open: Joi.number().required().messages({
    //   'any.required': 'The Ticker Open is required.',
    //   'number.empty': 'The Ticker Open cannot be empty.',
    // }),
    // ticker_high: Joi.number().required().messages({
    //   'any.required': 'The Ticker High is required.',
    //   'number.empty': 'The Ticker High cannot be empty.',
    // }),
    // ticker_low: Joi.number().required().messages({
    //   'any.required': 'The Ticker Low is required.',
    //   'number.empty': 'The Ticker Low cannot be empty.',
    // }),
    // ticker_volume: Joi.number().required().messages({
    //   'any.required': 'The Ticker Volume is required.',
    //   'number.empty': 'The Ticker Volume cannot be empty.',
    // }),
    // ticker_latest_trading_day: Joi.string().required().messages({
    //   'any.required': 'Ticker Latest Trading Day is required.',
    //   'string.empty': 'Ticker Latest Trading Day cannot be empty.'
    // }),
    // ticker_previous_close: Joi.number().required().messages({
    //   'any.required': 'The Ticker Previous Close is required.',
    //   'number.empty': 'The Ticker Previous Close cannot be empty.',
    // }),
    // ticker_change: Joi.number().required().messages({ 
    //   'any.required': 'The Ticker change is required.',
    //   'number.empty': 'The Ticker change cannot be empty.',
    // }),
    // ticker_change_percent: Joi.string().required().messages({
    //   'any.required': 'The Ticker change percent is required.',
    //   'string.empty': 'The Ticker change percent cannot be empty.'
    // }),
  }),
}).unknown(true);

const removeTickerFromWatchListValidation = joi.object({
  query: joi.object().keys({
    watchListTickerId: Joi.string().required().messages({
      'any.required': 'Watchlist Ticker Id is required.',
      'number.empty': 'Watchlist Ticker Id cannot be empty.',
    }),
  }).required()
}).unknown(true);

const fetchWatchListTickerByWatchlist = joi.object({
  query: joi.object().keys({
    watchListId: Joi.number().required().messages({
      'any.required': 'The Watchlist Id is required.',
      'number.empty': 'The Watchlist Id cannot be empty.',
    }),
    page : Joi.number().optional(),
    limit : Joi.number().optional()
  }).required()
}).unknown(true);

module.exports = Object.assign({}, {
  deleteWatchListValidation,
  editWatchListValidation,
  addWatchListValidation,
  addTickertoWatchListValidation,
  removeTickerFromWatchListValidation,
  fetchWatchListTickerByWatchlist
});