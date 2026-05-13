const Mensaje = require('../models/mensaje');
const User = require('../models/User');
const admin = require('../config/firebase');

const getMensajes = async (req, res) => {

    try {

        const { vacanteId, emisor, receptor } = req.params;

        const mensajes = await Mensaje.find({

            vacanteId,

            $or: [

                {
                    emisor,
                    receptor
                },

                {
                    emisor: receptor,
                    receptor: emisor
                }

            ]

        }).sort({
            fecha: 1
        });

        res.json(mensajes);

    } catch (e) {

        res.status(500).json({
            error: "Error mensajes"
        });

    }

};

const enviarMensaje = async (req, res) => {

    try {

        const {
            vacanteId,
            emisor,
            receptor,
            texto
        } = req.body;

        const nuevo = new Mensaje({

            vacanteId,

            emisor,

            receptor,

            texto

        });

        await nuevo.save();

        if (admin) {

            try {

                const receptorUser = await User.findOne({
                    email: receptor
                });

                if (receptorUser?.fcmToken) {

                    await admin.messaging().send({

                        token: receptorUser.fcmToken,

                        notification: {

                            title: "Nuevo mensaje 💬",

                            body: texto

                        }

                    });

                }

            } catch (firebaseError) {

                console.log(firebaseError);

            }

        }

        res.status(201).json({
            message: "Mensaje enviado"
        });

    } catch (e) {

        res.status(500).json({
            error: "Error mensaje"
        });

    }

};

module.exports = {
    getMensajes,
    enviarMensaje
};