const express = require('express');
const authController = require('../controllers/authController');
const { authValidators } = require('../middleware/validators');

const router = express.Router();

// Public routes
router.post('/signup', authValidators.register, authController.signup);
router.post('/login', authValidators.login, authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protected routes (require authentication)
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

module.exports = router;
