const express = require('express');
const router = express.Router();

const {
    getPostulacionesUsuario,
    getPostulantesVacante,
    eliminarPostulacion,
    enviarMensajeCandidato
} = require('../controllers/postulacionCtrl');

// GET /api/postulaciones/usuario/:email
router.get('/usuario/:email', getPostulacionesUsuario);

// GET /api/postulaciones/vacante/:vacanteId (para obtener postulantes)
router.get('/vacante/:vacanteId', getPostulantesVacante);

// DELETE /api/postulaciones/:id
router.delete('/:id', eliminarPostulacion);

// PUT /api/postulaciones/mensaje/:id
router.put('/mensaje/:id', enviarMensajeCandidato);

module.exports = router;