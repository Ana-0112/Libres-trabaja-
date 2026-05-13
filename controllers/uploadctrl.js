const cloudinary = require('../config/cloudinary');

const uploadArchivo = async (req, res) => {

    try {

        const result =
            await cloudinary.uploader.upload(

                req.body.data,

                {
                    folder: "libres_trabaja",
                    resource_type: "auto"
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