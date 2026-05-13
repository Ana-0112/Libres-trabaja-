const express = require('express');

const router = express.Router();

const {
    crearVacante,
    getVacantes,
    getVacantesReclutador
} = require('../controllers/vacanteCtrl');

const {
    postular
} = require('../controllers/postulacionCtrl');

router.post('/', crearVacante);

router.get('/', getVacantes);

router.get('/reclutador/:email', getVacantesReclutador);

router.post('/postular', postular);

module.exports = router;