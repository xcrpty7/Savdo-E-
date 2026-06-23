const Joi = require('joi');

const askAISchema = Joi.object({
  prompt: Joi.string().trim().min(1).max(2000),
  question: Joi.string().trim().min(1).max(2000),
  language: Joi.string().valid('uz', 'ru', 'en').default('uz'),
}).or('prompt', 'question');

module.exports = { askAISchema };
