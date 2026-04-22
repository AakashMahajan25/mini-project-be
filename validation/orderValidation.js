const { Joi } = require('celebrate');
const extension = require('@hapi/joi-date');
const joi = Joi.extend(extension);

const placeOrderValidation = Joi.object({
    body: joi.object().keys({
        order_id : Joi.number().required().messages({
            'any.required': 'Order Id is required.',
            'number.empty': 'Order Id cannot be empty.',
        }),
        plan_id: Joi.number().required().messages({
            'any.required': 'Plan Id is required.',
            'number.empty': 'Plan Id cannot be empty.',
        }),
        payment_status: Joi.string().required().messages({
            'any.required': 'Payment status is required.',
            'string.empty': 'Payment status cannot be empty.',
        }),
        // order_amount: Joi.number().required().messages({
        //     'any.required': 'Order Amount is required.',
        //     'number.empty': 'Order Amount cannot be empty.',
        // }),
        razorpay_payment_id: Joi.string().required().messages({
            'any.required': 'Razorpay Payment Id is required.',
            'string.empty': 'Razorpay Payment Id cannot be empty.',
        }),
        razorpay_order_id: Joi.string().required().messages({
            'any.required': 'Razorpay Order Id is required.',
            'string.empty': 'Razorpay Order Id cannot be empty.',
        }),
        razorpay_signature: Joi.string().required().messages({
            'any.required': 'Razorpay Signature is required.',
            'string.empty': 'Razorpay Signature cannot be empty.',
        }),
        failed_reason: Joi.string()
            .optional()
            .messages({
                'string.empty': 'Please give valid reasion.',
            }),
    })
}).unknown(true);

const orderIdValidation = Joi.object({
    params: Joi.object({
        orderId: joi.string().required().messages({
            'any.required': 'Order id params is required. Please provide orderId parameter.',
        }),
    }).required(),
}).unknown(true);

const initiateOrderValidation = Joi.object({
    body: Joi.object({
        plan_id: Joi.number().required().messages({
            'any.required': 'Plan Id is required.',
            'number.empty': 'Plan Id cannot be empty.',
        }),
        user_id: Joi.number().required().messages({
            'any.required': 'User Id is required.',
            'number.empty': 'User Id cannot be empty.',
        }),
        order_amount: Joi.number().required().messages({
            'any.required': 'Amount is required.',
            'number.empty': 'Amount cannot be empty.',
        }),
    }).required(),
}).unknown(true);

module.exports = Object.assign({}, {
    placeOrderValidation,
    orderIdValidation,
    initiateOrderValidation
});