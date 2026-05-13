const express = require('express');

const router = express.Router();

const {
    login,
    guardarToken,
    getPerfil,
    updatePerfil
} = require('../controllers/userCtrl');

router.post('/login', login);

router.post('/token', guardarToken);

router.get('/:email', getPerfil);

router.put('/', updatePerfil);

module.exports = router;