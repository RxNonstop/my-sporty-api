const express = require('express');
const router = express.Router();
const EquipoController = require('../controllers/EquipoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/mis-equipos', EquipoController.misEquipos);
router.get('/de-amigos', EquipoController.equiposDeAmigos);
router.get('/amigos/para-campeonato/:campeonato_id', EquipoController.equiposDeAmigosParaCampeonato);
router.post('/buscar', EquipoController.buscarPorNombre);

router.get('/', EquipoController.index);
router.post('/', EquipoController.store);
router.get('/:id', EquipoController.show);
router.put('/:id', EquipoController.update);
router.patch('/:id', EquipoController.update);
router.delete('/:id', EquipoController.delete);

module.exports = router;
