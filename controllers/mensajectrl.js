const Mensaje = require('../models/Mensaje');
const User = require('../models/User');
const admin = require('../config/firebase');

const getMensajes = async (req, res) => {

    try {

        const { vacanteId, emisor, receptor } = req.params;

        // Normalizar emails a minúsculas para la búsqueda
        const emisorLower = emisor.toLowerCase().trim();
        const receptorLower = receptor.toLowerCase().trim();

        const mensajes = await Mensaje.find({

            vacanteId,

            $or: [

                {
                    emisor: emisorLower,
                    receptor: receptorLower
                },

                {
                    emisor: receptorLower,
                    receptor: emisorLower
                }

            ]

        }).sort({
            fecha: 1
        });

        // Formatear la fecha antes de enviar
        const mensajesFormateados = mensajes.map(m => ({
            vacanteId: m.vacanteId,
            emisor: m.emisor,
            receptor: m.receptor,
            texto: m.texto,
            time: m.fecha ? new Date(m.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
            fecha: m.fecha
        }));

        res.json(mensajesFormateados);

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

        // Normalizar emails a minúsculas
        const emisorLower = emisor.toLowerCase().trim();
        const receptorLower = receptor.toLowerCase().trim();

        const nuevo = new Mensaje({

            vacanteId,

            emisor: emisorLower,

            receptor: receptorLower,

            texto

        });

        await nuevo.save();

        if (admin) {

            try {

                // Buscar usuario con email normalizado
                const receptorUser = await User.findOne({
                    email: receptorLower
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