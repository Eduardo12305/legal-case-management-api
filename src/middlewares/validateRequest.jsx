const AppError = require('../utils/appError.jsx');

function validateRequest(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body(req.body);
      }

      if (schema.query) {
        req.query = schema.query(req.query);
      }

      if (schema.params) {
        req.params = schema.params(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      return next(new AppError(error.message || 'Requisição inválida', 400));
    }
  };
}

module.exports = validateRequest;
