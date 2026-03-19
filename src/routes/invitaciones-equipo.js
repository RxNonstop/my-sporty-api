const express = require('express');
const router = express.Router();
const InvitacionEquipoController = require('../controllers/InvitacionEquipoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', InvitacionEquipoController.index);
router.post('/', InvitacionEquipoController.store);
router.put('/:id', InvitacionEquipoController.update);
router.patch('/:id', InvitacionEquipoController.update);
router.delete('/:id', InvitacionEquipoController.delete);

module.exports = router;
