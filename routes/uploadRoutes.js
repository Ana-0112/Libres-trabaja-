const express = require('express');

const router = express.Router();

const {
    uploadArchivo,
    getSignedUrl
} = require('../controllers/uploadCtrl');

router.post('/', uploadArchivo);
router.get('/signed', getSignedUrl);

module.exports = router;