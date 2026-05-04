require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2; // 1. Importar Cloudinary

const app = express();

// 2. Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Aumentamos el límite para recibir archivos Base64
// Permite recibir archivos de hasta 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- CONEXIÓN A BASE DE DATOS ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión:", err));

// --- MODELOS DE DATOS ---
const UserSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: { type: String, unique: true, required: true },
    telefono: String,
    password: { type: String, required: true },
    rol: String, 
    nombreEmpresa: String,
    ubicacion: String,
    verificado: { type: Boolean, default: false },
    codigoVerificacion: String,
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" } // Aquí se guardará el link de Cloudinary
});
const User = mongoose.model('User', UserSchema);

// (El resto de tus esquemas como Vacante se mantienen igual...)

// --- NUEVA RUTA PARA SUBIR ARCHIVOS ---
app.post('/api/upload', async (req, res) => {
    const { data, folder } = req.body; // data es el Base64, folder es "fotos" o "cvs"
    try {
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `libres_trabaja/${folder}`,
            resource_type: "auto" // Detecta si es imagen o PDF automáticamente
        });
        
        // Devolvemos la URL segura de Cloudinary
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        console.error("Error en Cloudinary:", error);
        res.status(500).json({ error: "Error al subir archivo a la nube" });
    }
});

// --- EL RESTO DE TUS RUTAS (Login, Register, etc.) ---
// Se mantienen exactamente igual, solo asegúrate de que al llamar a 
// /api/perfil/update mandes la URL que te dio Cloudinary.

app.put('/api/perfil/update', async (req, res) => {
    const { email, nombre, telefono, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (telefono) updateData.telefono = telefono;
        if (fotoPerfil !== undefined) updateData.fotoPerfil = fotoPerfil; 
        if (cvUrl !== undefined) updateData.cvUrl = cvUrl;

        const usuarioActualizado = await User.findOneAndUpdate(
            { email: email.trim() },
            { $set: updateData },
            { new: true }
        );

        if (!usuarioActualizado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Actualizado con éxito", user: usuarioActualizado });
    } catch (error) {
        console.error("Error en update:", error);
        res.status(500).json({ message: "Error al actualizar en Atlas" });
    }
});

// (Mantén tus rutas de enviar-codigo, verificar-codigo, perfil/:email y vacantes igual)

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});