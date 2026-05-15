const express = require('express');

const router = express.Router();

const {
    crearVacante,
    getVacantes,
    getVacantesReclutador,
    eliminarVacante,
    actualizarVacante,
    getVacantesFeed,
    getPostulantesVacante
} = require('../controllers/vacanteCtrl');

const { postular } = require('../controllers/postulacionCtrl');

router.post('/', crearVacante);

router.get('/', getVacantes);

router.get('/feed', getVacantesFeed);

router.get('/reclutador/:email', getVacantesReclutador);

router.delete('/:id', eliminarVacante);

router.put('/:id', actualizarVacante);

router.get('/postulantes/:vacanteId', getPostulantesVacante);

module.exports = router;
