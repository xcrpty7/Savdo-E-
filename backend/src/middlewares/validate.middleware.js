const ApiError = require('../utils/ApiError');

/**
 * Joi schema validation middleware.
 * Usage: validate(schema) — validates req.body against a Joi schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(new ApiError(422, errors.join(', '), errors));
  }

  req.body = value;
  next();
};

module.exports = { validate };
