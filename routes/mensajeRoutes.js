const express = require('express');

const router = express.Router();

const {

    getMensajes,
    enviarMensaje,
    obtenerMensajesSimple

} = require('../controllers/mensajeCtrl');

// Ruta simple para obtener mensajes (compatibilidad)
router.get('/:emisor/:receptor', obtenerMensajesSimple);

// Ruta con vacanteId
router.get('/:vacanteId/:emisor/:receptor', getMensajes);

router.post('/enviar', enviarMensaje);

module.exports = router;