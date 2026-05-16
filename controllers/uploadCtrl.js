const cloudinary = require('../config/cloudinary');

const uploadArchivo = async (req, res) => {

    try {

        const data = req.body.data || '';

        // Forzar image para PDFs (raw → 401 en algunos planes de Cloudinary)
        const isPDF = data.startsWith('data:application/pdf');

        const result =
            await cloudinary.uploader.upload(

                data,

                {
                    folder: "libres_trabaja",
                    resource_type: isPDF ? "image" : "auto"
                }

            );

        res.json({
            url: result.secure_url
        });

    } catch (e) {

        res.status(500).json({
            error: "Error upload"
        });

    }

};

module.exports = {
    uploadArchivo
};