const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  buyPrice: Joi.number().min(0).required(),
  sellPrice: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  unit: Joi.string().trim().default('dona'),
  // Optional legacy e-commerce fields
  description: Joi.string().trim().max(5000).allow('').default(''),
  price: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).max(100).default(0),
  category: Joi.string().trim().lowercase().allow('').default(''),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().allow('').default(''),
      })
    )
    .default([]),
  brand: Joi.string().trim().allow('').default(''),
  tags: Joi.array().items(Joi.string().trim().lowercase()).default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().max(200),
  buyPrice: Joi.number().min(0),
  sellPrice: Joi.number().min(0),
  unit: Joi.string().trim(),
  description: Joi.string().trim().max(5000).allow(''),
  price: Joi.number().min(0),
  discount: Joi.number().min(0).max(100),
  category: Joi.string().trim().lowercase().allow(''),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().allow('').default(''),
    })
  ),
  stock: Joi.number().integer().min(0),
  brand: Joi.string().trim().allow(''),
  tags: Joi.array().items(Joi.string().trim().lowercase()),
  isActive: Joi.boolean(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).required(),
});

module.exports = { createProductSchema, updateProductSchema, reviewSchema };
