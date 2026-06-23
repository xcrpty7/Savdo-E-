const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.string().length(24).hex().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
});

module.exports = { addToCartSchema, updateCartItemSchema };
