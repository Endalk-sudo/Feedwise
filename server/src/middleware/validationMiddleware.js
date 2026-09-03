import { z } from 'zod';
import logger from '../utils/logger.js';

/**
 * Middleware to validate request data using Zod
 * @param {Object} schemas - Object containing schemas for body, query, and params
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      
      logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errorMessages,
      });
    }
    next(error);
  }
};

export default validate;
