require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

const app = express();

// --- 1. CONFIGURACIÓN DE LÍMITES ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- 2. CONFIGURACIÓN DE CLOUDINARY (INTACTO) ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 3. CONFIGURACIÓN DE GMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// --- 4. CONEXIÓN A MONGO ATLAS ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("Error de conexión MongoDB:", err));

// --- 5. MODELO DE USUARIO ---
const UserSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: { type: String, unique: true, required: true },
    telefono: String,
    password: { type: String, required: true },
    rol: String, 
    verificado: { type: Boolean, default: false },
    codigoVerificacion: String,
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);

// --- 6. RUTAS DE PERFIL ---

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim() });
        if (user) {
            res.status(200).json({
                nombres: user.nombre, // Kotlin espera "nombres" en el GET
                fotoPerfil: user.fotoPerfil,
                cvUrl: user.cvUrl,
                verificado: user.verificado
            });
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en servidor" });
    }
});

// --- 7. VERIFICACIÓN GMAIL ---

app.post('/api/enviar-codigo-email', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const user = await User.findOneAndUpdate(
            { email: email.trim() }, 
            { codigoVerificacion: codigo },
            { new: true }
        );
        
        if (!user) return res.status(404).json({ error: "Usuario no registrado" });

        const mailOptions = {
            from: `"Libres Trabaja" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: 'Código de Verificación - Libres Trabaja',
            html: `
                <div style="font-family: sans-serif; text-align: center; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #008080;">Libres Trabaja</h2>
                    <p>Usa el siguiente código para verificar tu perfil:</p>
                    <h1 style="color: #333; letter-spacing: 5px;">${codigo}</h1>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Código enviado" });

    } catch (error) {
        res.status(500).json({ error: "Fallo al enviar correo" });
    }
});

app.post('/api/verificar-codigo', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), codigoVerificacion: codigo });
        if (user) {
            await User.findOneAndUpdate(
                { email: email.trim() }, 
                { verificado: true, codigoVerificacion: null }
            );
            res.status(200).json({ message: "Verificado" });
        } else {
            res.status(400).json({ error: "Código incorrecto" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al verificar" });
    }
});

// --- 8. CLOUDINARY UPLOAD (INTACTO) ---
app.post('/api/upload', async (req, res) => {
    const { data, folder } = req.body; 
    try {
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `libres_trabaja/${folder}`,
            resource_type: "auto"
        });
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        res.status(500).json({ error: "Error al subir a Cloudinary" });
    }
});

// --- 9. ACTUALIZACIÓN DE PERFIL (Ajustado para Kotlin) ---
app.put('/api/perfil/update', async (req, res) => {
    // Aceptamos "nombre" o "nombres" para evitar errores de sincronización
    const { email, nombre, nombres, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        
        // Sincronizamos los nombres al campo "nombre" de MongoDB
        if (nombre) updateData.nombre = nombre;
        else if (nombres) updateData.nombre = nombres;

        if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
        if (cvUrl) updateData.cvUrl = cvUrl;

        await User.findOneAndUpdate(
            { email: email.trim() }, 
            { $set: updateData }
        );
        res.status(200).json({ message: "Perfil actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// --- 10. LOGIN Y REGISTRO ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), password: password.trim() });
        if (user) {
            res.status(200).json({ 
                rol: user.rol,
                nombres: user.nombre,
                email: user.email,
                verificado: user.verificado
            });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en login" });
    }
});

app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new User(req.body);
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(400).json({ error: "Error en registro" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});