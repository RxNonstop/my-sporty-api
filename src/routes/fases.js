const express = require('express');
const router = express.Router();
const FaseController = require('../controllers/FaseController');
const EstadisticaController = require('../controllers/EstadisticaController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/campeonato/:campeonato_id', FaseController.showByCampeonato);
router.get('/', FaseController.index);
router.post('/', FaseController.store);
router.get('/:id', FaseController.show);
router.put('/:id', FaseController.update);
router.patch('/:id', FaseController.update);
router.delete('/:id', FaseController.delete);

// Rutas de Estadisticas (Tabla de Posiciones)
router.get('/:fase_id/posiciones', EstadisticaController.getPosicionesPorFase);

module.exports = router;
