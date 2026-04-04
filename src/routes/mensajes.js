const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/MensajeController');
const verifyToken = require('../middlewares/auth');

// Rutas protegidas
router.use(verifyToken);

// Resumen general
router.get('/resumen', mensajeController.getResumen);

// Obtener historial con un amigo
router.get('/amigo/:amigoId', mensajeController.getHistorialAmigo);

// Obtener historial con un equipo
router.get('/equipo/:equipoId', mensajeController.getHistorialEquipo);

// Marcar como leídos
router.post('/amigo/:amigoId/leer', mensajeController.marcarAmigoLeido);
router.post('/equipo/:equipoId/leer', mensajeController.marcarEquipoLeido);

module.exports = router;
