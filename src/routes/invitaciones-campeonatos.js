const express = require('express');
const router = express.Router();
const InvitacionCampeonatosController = require('../controllers/InvitacionCampeonatosController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', InvitacionCampeonatosController.index);
router.get('/solicitudes-recibidas', InvitacionCampeonatosController.indexSolicitudesRecibidas);
router.post('/', InvitacionCampeonatosController.store);
router.post('/solicitud-union', InvitacionCampeonatosController.storeSolicitudUnion);
router.put('/:id', InvitacionCampeonatosController.update);
router.patch('/:id', InvitacionCampeonatosController.update);
router.delete('/:id', InvitacionCampeonatosController.delete);

module.exports = router;
