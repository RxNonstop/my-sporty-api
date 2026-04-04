const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const usuariosRoutes = require('./usuarios');
const equiposRoutes = require('./equipos');
const campeonatosRoutes = require('./campeonatos');
const amistadesRoutes = require('./amistades');
const solicitudesAmistadRoutes = require('./solicitudes-amistad');
const escenariosDeportivosRoutes = require('./escenarios-deportivos');
const fasesRoutes = require('./fases');
const partidosRoutes = require('./partidos');
const invitacionesEquipoRoutes = require('./invitaciones-equipo');
const miembrosEquipoRoutes = require('./miembros-equipo');
const invitacionesCampeonatosRoutes = require('./invitaciones-campeonatos');
const miembrosCampeonatosRoutes = require('./miembros-campeonatos');
const mensajesRoutes = require('./mensajes');

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/equipos', equiposRoutes);
router.use('/campeonatos', campeonatosRoutes);
router.use('/amistades', amistadesRoutes);
router.use('/solicitudes-amistad', solicitudesAmistadRoutes);
router.use('/escenarios-deportivos', escenariosDeportivosRoutes);
router.use('/fases', fasesRoutes);
router.use('/partidos', partidosRoutes);
router.use('/invitaciones-equipo', invitacionesEquipoRoutes);
router.use('/miembros-equipo', miembrosEquipoRoutes);
router.use('/invitaciones-campeonatos', invitacionesCampeonatosRoutes);
router.use('/miembros-campeonatos', miembrosCampeonatosRoutes);
router.use('/mensajes', mensajesRoutes);

module.exports = router;
