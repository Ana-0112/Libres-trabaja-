const express = require('express');

const router = express.Router();

const {
    uploadArchivo,
    getSignedUrl,
    deleteArchivo
} = require('../controllers/uploadCtrl');

router.post('/', uploadArchivo);
router.get('/signed', getSignedUrl);
router.post('/delete', deleteArchivo);

module.exports = router;