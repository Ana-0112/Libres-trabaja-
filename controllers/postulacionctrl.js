const Postulacion = require('../models/postulacion');
const Vacante = require('../models/Vacante');
const User = require('../models/User');

const postular = async (req, res) => {

    try {

        const { vacanteId, candidatoEmail } = req.body;

        const email =
            candidatoEmail
            .trim()
            .toLowerCase();

        const existe = await Postulacion.findOne({

            vacanteId,

            candidatoEmail: email

        });

        if (existe) {

            return res.status(400).json({
                error: "Ya postulado"
            });

        }

        const vacante =
            await Vacante.findById(vacanteId);

        const usuario =
            await User.findOne({
                email
            });

        const nueva = new Postulacion({

            ...req.body,

            candidatoEmail: email,

            reclutadorEmail:
                vacante?.reclutadorEmail || "",

            nombreCandidato:
                usuario?.nombre || ""

        });

        await nueva.save();

        await Vacante.findByIdAndUpdate(

            vacanteId,

            {
                $addToSet: {
                    postulantes: email
                }
            }

        );

        res.status(201).json({
            message: "Postulado"
        });

    } catch (e) {

        res.status(500).json({
            error: "Error postulación"
        });

    }

};

module.exports = {
    postular
};