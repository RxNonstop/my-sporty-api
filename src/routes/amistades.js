const express = require('express');
const router = express.Router();
const AmistadController = require('../controllers/AmistadController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/equipos', AmistadController.equipos);
router.get('/', AmistadController.index);
router.post('/', AmistadController.store);
router.delete('/:id', AmistadController.delete);

module.exports = router;
