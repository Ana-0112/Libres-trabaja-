require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

const app = express();

// --- 1. CONFIGURACIÓN DE LÍMITES (Para fotos y PDFs pesados) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- 2. CONFIGURACIÓN DE CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 3. CONEXIÓN A MONGO ATLAS ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión:", err));

// --- 4. MODELO DE USUARIO ---
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
    cvUrl: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);

// --- 5. RUTA: REGISTRO DE USUARIOS ---
app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new User(req.body);
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        console.error("Error al registrar:", error);
        res.status(400).json({ error: "El correo ya está registrado o faltan datos." });
    }
});

// --- 6. RUTA: LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ 
            email: email.trim(), 
            password: password.trim() 
        });

        if (user) {
            res.status(200).json({ 
                message: "Login exitoso",
                rol: user.rol,
                nombres: user.nombre,
                apellidos: user.apellidos,
                email: user.email,
                telefono: user.telefono,
                verificado: user.verificado,
                fotoPerfil: user.fotoPerfil,
                cvUrl: user.cvUrl 
            });
        } else {
            res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- 7. RUTA: SUBIR A CLOUDINARY (Fotos y CVs) ---
app.post('/api/upload', async (req, res) => {
    const { data, folder } = req.body; 
    try {
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `libres_trabaja/${folder}`,
            resource_type: "auto"
        });
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        console.error("Error en Cloudinary:", error);
        res.status(500).json({ error: "Error al subir archivo a la nube" });
    }
});

// --- 8. ACTUALIZAR PERFIL ---
// En tu server.js (Node.js)
app.put('/api/perfil/update', async (req, res) => {
    const { email, nombre, nombres, telefono, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        // Aceptamos 'nombre' o 'nombres' para que no falle la sincronización
        if (nombre || nombres) updateData.nombre = nombre || nombres; 
        if (telefono) updateData.telefono = telefono;
        if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
        if (cvUrl) updateData.cvUrl = cvUrl;

        await User.findOneAndUpdate({ email: email.trim() }, { $set: updateData });
        res.status(200).json({ message: "Sincronizado con Atlas" });
    } catch (error) {
        res.status(500).json({ error: "Error al sincronizar" });
    }
});

// --- 9. VERIFICACIÓN POR EMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.post('/api/enviar-codigo-email', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        await User.findOneAndUpdate({ email: email.trim() }, { codigoVerificacion: codigo });
        const mailOptions = {
            from: `"Libres Trabaja" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: 'Código de Verificación - Libres Trabaja',
            text: `Tu código es: ${codigo}`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Código enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar correo' });
    }
});

// --- 10. PUERTO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});