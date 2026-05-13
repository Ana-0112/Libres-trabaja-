const User = require('../models/User');

const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({

            email: email.trim().toLowerCase(),

            password: password.trim()

        });

        if (!user) {

            return res.status(401).json({
                error: "Usuario no encontrado"
            });

        }

        res.json(user);

    } catch (e) {

        console.log("ERROR LOGIN:", e);

        res.status(500).json({
            error: "Error login"
        });

    }

};

const guardarToken = async (req, res) => {

    try {

        const { email, token } = req.body;

        const user = await User.findOneAndUpdate(

            {
                email: email.trim().toLowerCase()
            },

            {
                $set: {
                    fcmToken: token
                }
            },

            {
                new: true
            }

        );

        res.json({
            message: "Token guardado"
        });

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error token"
        });

    }

};

const getPerfil = async (req, res) => {

    try {

        const user = await User.findOne({

            email: req.params.email.trim().toLowerCase()

        });

        if (!user) {

            return res.status(404).json({
                error: "Perfil no encontrado"
            });

        }

        res.json(user);

    } catch (e) {

        res.status(500).json({
            error: "Error perfil"
        });

    }

};

const updatePerfil = async (req, res) => {

    try {

        const user = await User.findOneAndUpdate(

            {
                email: req.body.email.trim().toLowerCase()
            },

            {
                $set: req.body
            },

            {
                new: true
            }

        );

        res.json(user);

    } catch (e) {

        res.status(500).json({
            error: "Error update perfil"
        });

    }

};

module.exports = {
    login,
    guardarToken,
    getPerfil,
    updatePerfil
};