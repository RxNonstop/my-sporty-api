const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const authMiddleware = require('../middlewares/auth');

router.post('/email', UsuarioController.showByEmail); // Specific POST route based on routes.php
router.get('/', UsuarioController.index);
router.get('/:id', UsuarioController.show);
router.put('/:id', UsuarioController.update);
router.patch('/:id', UsuarioController.update);
router.delete('/:id', UsuarioController.delete);

// Registrar push token
router.put('/update/push-token', authMiddleware, UsuarioController.updatePushToken);

module.exports = router;
