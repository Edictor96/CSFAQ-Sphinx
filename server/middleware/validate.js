const validator = require('validator');
const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, _res, next) => {
    const errors = [];
    const fields = schema.fields || {};

    for (const [field, rules] of Object.entries(fields)) {
      const value = req.body[field];

      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${field} is required`);
        continue;
      }

      if (!value && !rules.required) continue;

      const strVal = String(value).trim();

      if (rules.type === 'email' && !validator.isEmail(strVal)) {
        errors.push('Invalid email format');
      }

      if (rules.minLength && strVal.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && strVal.length > rules.maxLength) {
        errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
      }

      if (rules.pattern && !rules.pattern.test(strVal)) {
        errors.push(rules.message || `Invalid ${field} format`);
      }

      if (rules.enum && !rules.enum.includes(strVal)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    if (schema.custom) {
      const customErrors = schema.custom(req.body);
      errors.push(...customErrors);
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join('. '), 400));
    }

    next();
  };
};

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const registerSchema = {
  fields: {
    name: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, type: 'email' },
    password: {
      required: true,
      minLength: 8,
      pattern: passwordPattern,
      message:
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
    },
  },
  custom: (body) => {
    const errs = [];
    if (body.password !== body.confirmPassword) {
      errs.push('Passwords do not match');
    }
    if (!body.termsAccepted) {
      errs.push('You must accept the terms and conditions');
    }
    return errs;
  },
};

const loginSchema = {
  fields: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 1 },
  },
};

const forgotPasswordSchema = {
  fields: {
    email: { required: true, type: 'email' },
  },
};

const resetPasswordSchema = {
  fields: {
    password: {
      required: true,
      minLength: 8,
      pattern: passwordPattern,
      message:
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
    },
  },
  custom: (body) => {
    if (body.password !== body.confirmPassword) {
      return ['Passwords do not match'];
    }
    return [];
  },
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
