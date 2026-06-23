const Joi = require('joi');

const operationSchema = Joi.object({
  operation: Joi.string().valid('create', 'update', 'delete').required(),
  entity: Joi.string().valid('product', 'sale').required(),
  entityId: Joi.string().required(),
  payload: Joi.object().required(),
  clientUpdatedAt: Joi.alternatives().try(Joi.date().iso(), Joi.number()).optional(),
});

const pushSyncSchema = Joi.object({
  operations: Joi.array().items(operationSchema).min(1).required(),
});

module.exports = { pushSyncSchema };
