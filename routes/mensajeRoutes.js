const express = require('express');

const router = express.Router();

const {
    getMensajes,
    enviarMensaje
} = require('../controllers/mensajeCtrl');

router.get('/:vacanteId/:emisor/:receptor', getMensajes);

router.post('/', enviarMensaje);

module.exports = router;