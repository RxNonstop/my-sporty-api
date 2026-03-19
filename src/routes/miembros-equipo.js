const express = require('express');
const router = express.Router();
const MiembrosEquipoController = require('../controllers/MiembrosEquipoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', MiembrosEquipoController.index);
router.post('/', MiembrosEquipoController.store);
router.patch('/', MiembrosEquipoController.update);
router.delete('/', MiembrosEquipoController.delete);

module.exports = router;
