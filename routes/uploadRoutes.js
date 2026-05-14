const express = require('express');

const router = express.Router();

const {
    uploadArchivo
} = require('../controllers/tempUpload');

router.post('/', uploadArchivo);

module.exports = router;