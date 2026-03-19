const express = require('express');
const router = express.Router();
const CampeonatoController = require('../controllers/CampeonatoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/publicos', CampeonatoController.indexPublicos);
router.get('/buscar', CampeonatoController.buscarPorNombre);
router.get('/propietario/:id', CampeonatoController.showByPropietario);
router.get('/participando/:usuario_id', CampeonatoController.getParticipando);
router.get('/estado/:estado', CampeonatoController.showByEstado);
router.get('/deporte/:deporte', CampeonatoController.showByDeporte);

router.get('/', CampeonatoController.index);
router.post('/', CampeonatoController.store);
router.get('/:id', CampeonatoController.show);
router.put('/:id', CampeonatoController.update);
router.patch('/:id', CampeonatoController.update);
router.delete('/:id', CampeonatoController.delete);

module.exports = router;
