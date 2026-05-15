const express = require('express');

const router = express.Router();

const {

    login,
    guardarToken,
    getPerfil,
    updatePerfil,
    registro,
    actualizarToken,
    updateCurriculum,
    eliminarCurriculum,
    enviarCodigoEmail,
    verificarCodigo

} = require('../controllers/userCtrl');

// Rutas de autenticación
router.post('/login', login);

router.post('/registro', registro);

router.post('/guardar-token', guardarToken);

router.put('/token', actualizarToken);

// Rutas de perfil
router.get('/perfil/:email', getPerfil);

router.put('/perfil/update', updatePerfil);

// Rutas de curriculum
router.put('/perfil/curriculum', updateCurriculum);

router.delete('/perfil/curriculum/:userId', eliminarCurriculum);

// Rutas de empresa
router.get('/perfil/empresa/:email', getPerfil);

// Rutas de verificación de email
router.post('/enviar-codigo-email', enviarCodigoEmail);

router.post('/verificar-codigo', verificarCodigo);

module.exports = router;