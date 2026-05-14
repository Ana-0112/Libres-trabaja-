const express = require('express');

const router = express.Router();

const {

    login,
    guardarToken,
    getPerfil,
    updatePerfil

} = require('../controllers/userCtrl');

router.post('/login', login);

router.post('/guardar-token', guardarToken);

router.get('/perfil/:email', getPerfil);

router.put('/perfil/update', updatePerfil);

module.exports = router;