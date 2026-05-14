const express = require('express');

const router = express.Router();

const {
    uploadArchivo
} = require('../controllers/uploadCtrl');

router.post('/', uploadArchivo);

module.exports = router;