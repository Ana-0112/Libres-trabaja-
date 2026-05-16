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

        // Eliminar archivo anterior si se especificó
        const oldUrl = req.body.oldUrl;
        if (oldUrl && oldUrl !== result.secure_url) {
            const match = oldUrl.match(/\/upload\/v\d+\/(.+?)(\.[^/.]+)?$/);
            if (match) {
                const publicId = match[1];
                const resType = oldUrl.includes('/raw/') ? 'raw' : 'image';
                await cloudinary.uploader.destroy(publicId, { resource_type: resType })
                    .catch(() => {});
            }
        }

        res.json({
            url: result.secure_url
        });

    } catch (e) {

        res.status(500).json({
            error: "Error upload"
        });

    }

};

// Generar signed URL para files que requieren autenticación
const getSignedUrl = async (req, res) => {
    try {
        const rawUrl = req.query.url;
        if (!rawUrl) return res.status(400).json({ error: "Falta url" });

        const match = rawUrl.match(/\/(image|raw)\/upload\/v\d+\/(.+?)(\.[^/.]+)?$/);
        if (!match) return res.status(400).json({ error: "URL inválida" });

        const resourceType = match[1];
        const publicId = match[2];
        const signedUrl = cloudinary.url(publicId, {
            resource_type: resourceType,
            type: "upload",
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        });

        res.json({ url: signedUrl });
    } catch (e) {
        res.status(500).json({ error: "Error al generar URL firmada" });
    }
};

module.exports = {
    uploadArchivo,
    getSignedUrl
};