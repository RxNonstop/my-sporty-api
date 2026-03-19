const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/auth');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
