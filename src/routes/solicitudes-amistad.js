const express = require('express');
const router = express.Router();
const SolicitudAmistadController = require('../controllers/SolicitudAmistadController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', SolicitudAmistadController.index);
router.post('/', SolicitudAmistadController.store);
router.put('/:id', SolicitudAmistadController.update);
router.patch('/:id', SolicitudAmistadController.update);
router.delete('/:id', SolicitudAmistadController.delete);

module.exports = router;
