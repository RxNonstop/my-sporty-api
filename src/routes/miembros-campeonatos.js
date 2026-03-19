const express = require('express');
const router = express.Router();
const MiembrosCampeonatosController = require('../controllers/MiembrosCampeonatosController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/:id', MiembrosCampeonatosController.show);
router.put('/:id', MiembrosCampeonatosController.update);
router.patch('/:id', MiembrosCampeonatosController.update);
router.delete('/:id', MiembrosCampeonatosController.delete);

module.exports = router;
