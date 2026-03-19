const express = require('express');
const router = express.Router();
const EscenarioDeportivoController = require('../controllers/EscenarioDeportivoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/buscar', EscenarioDeportivoController.showByName);
router.get('/buscar/:nombre', EscenarioDeportivoController.showByName);
router.get('/', EscenarioDeportivoController.index);
router.post('/', EscenarioDeportivoController.store);
router.get('/:id', EscenarioDeportivoController.show);
router.put('/:id', EscenarioDeportivoController.update);
router.patch('/:id', EscenarioDeportivoController.update);
router.delete('/:id', EscenarioDeportivoController.delete);

module.exports = router;
