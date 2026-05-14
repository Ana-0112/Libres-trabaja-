const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    nombre: String,

    email: {
        type: String,
        unique: true
    },

    rol: {
        type: String,
        default: "candidato"
    },

    fotoPerfil: String,

    cvUrl: String,

    empresa: String,

    telefono: String,

    password: String,

    fcmToken: {
        type: String,
        default: ""
    }

}, {
    collection: 'users'
});

module.exports = mongoose.model('User', userSchema);