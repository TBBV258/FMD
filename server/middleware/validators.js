const { body, param, query, validationResult } = require('express-validator');
const createHttpError = require('http-errors');

// Common validation rules
const commonRules = {
  email: body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  phone: body('phone')
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  documentId: param('id')
    .isMongoId()
    .withMessage('Invalid document ID format'),

  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
};

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(createHttpError(400, 'Validation failed', { errors: errorMessages }));
  };
};

// Common validation chains
const authValidators = {
  register: validate([
    commonRules.name,
    commonRules.email,
    commonRules.password,
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  ]),

  login: validate([
    commonRules.email,
    body('password').notEmpty().withMessage('Password is required'),
  ]),
};

const documentValidators = {
  create: validate([
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('documentType')
      .isIn(['ID', 'PASSPORT', 'DRIVER_LICENSE', 'OTHER'])
      .withMessage('Invalid document type'),
    body('lostDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object')
      .bail()
      .custom((value) => {
        if (!value.coordinates || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
          throw new Error('Invalid location coordinates');
        }
        const [lng, lat] = value.coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error('Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90');
        }
        return true;
      }),
  ]),

  update: validate([
    commonRules.documentId,
    body('status')
      .optional()
      .isIn(['LOST', 'FOUND', 'RETURNED', 'IN_PROGRESS'])
      .withMessage('Invalid status'),
  ]),

  getById: validate([
    commonRules.documentId,
  ]),
};

const userValidators = {
  updateProfile: validate([
    commonRules.name,
    commonRules.email.optional(),
    commonRules.phone.optional(),
    body('address')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Address cannot exceed 500 characters'),
  ]),
};

module.exports = {
  validate,
  commonRules,
  authValidators,
  documentValidators,
  userValidators,
};
