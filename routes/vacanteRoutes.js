const express = require('express');

const router = express.Router();

const {

    crearVacante,
    getVacantes,
    getVacantesReclutador

} = require('../controllers/vacanteCtrl');

const { postingan, getPostulantesVacante } = require('../controllers/postulacionCtrl');

router.post('/', crearVacante);

router.get('/', getVacantes);

router.get('/reclutador/:email', getVacantesReclutador);

router.post('/postular', postingan);

// Ruta para obtener postulantes de una vacante (compatibilidad con frontend)
router.get('/postulantes/:vacanteId', getPostulantesVacante);

module.exports = router;