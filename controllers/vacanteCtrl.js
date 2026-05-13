const Vacante = require('../models/vacante');

const crearVacante = async (req, res) => {

    try {

        const nueva = new Vacante({

            ...req.body,

            reclutadorEmail:
                req.body.reclutadorEmail
                ?.trim()
                .toLowerCase()

        });

        await nueva.save();

        res.status(201).json({
            message: "Vacante creada"
        });

    } catch (e) {

        console.log(e);

        res.status(500).json({
            error: "Error vacante"
        });

    }

};

const getVacantes = async (req, res) => {

    try {

        const data = await Vacante.find()
            .sort({
                fechaCreacion: -1
            });

        res.json(data);

    } catch (e) {

        res.status(500).json({
            error: "Error vacantes"
        });

    }

};

const getVacantesReclutador = async (req, res) => {

    try {

        const email =
            req.params.email
            .trim()
            .toLowerCase();

        const data = await Vacante.find({
            reclutadorEmail: email
        });

        res.json(data);

    } catch (e) {

        res.status(500).json({
            error: "Error reclutador"
        });

    }

};

module.exports = {
    crearVacante,
    getVacantes,
    getVacantesReclutador
};