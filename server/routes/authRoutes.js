const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../middleware/validate');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many reset requests. Try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticateUser, authController.logout);
router.put('/change-password', authenticateUser, authController.changePassword);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticateUser, authController.getMe);
router.put('/profile', authenticateUser, authController.updateProfile);

router.post('/seed-admin', async (req, res) => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ email: 'sudarshansudarshan@gmail.com' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', email: existing.email, role: existing.role });
    }
    const admin = await User.create({
      name: 'Sudarshan Admin',
      email: 'sudarshansudarshan@gmail.com',
      password: 'Admin@123',
      role: 'super_admin',
      isVerified: true,
    });
    res.status(201).json({ success: true, message: 'Super admin created', email: admin.email });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
