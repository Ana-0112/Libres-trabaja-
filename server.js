require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Volvemos a Nodemailer
const cloudinary = require('cloudinary').v2;

const app = express();

// --- 1. CONFIGURACIÓN DE LÍMITES ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- 2. CONFIGURACIÓN DE SERVICIOS (Cloudinary) ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 3. CONFIGURACIÓN DE GMAIL (Nodemailer) ---
// Esta configuración usa el puerto 587 para intentar saltar el bloqueo de Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Tu contraseña de aplicación de 16 letras
    },
    tls: {
        rejectUnauthorized: false // Ayuda a conectar desde servidores externos
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
    nombreEmpresa: String,
    ubicacion: String,
    verificado: { type: Boolean, default: false },
    codigoVerificacion: String,
    fotoPerfil: { type: String, default: "" },
    cvUrl: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);

// --- 6. RUTAS DE PERFIL Y VERIFICACIÓN ---

app.get('/api/perfil/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim() });
        if (user) {
            res.status(200).json({
                nombres: user.nombre,
                telefono: user.telefono,
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

app.post('/api/verificar-codigo', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), codigoVerificacion: codigo });
        if (user) {
            await User.findOneAndUpdate(
                { email: email.trim() }, 
                { verificado: true, codigoVerificacion: null },
                { returnDocument: 'after' }
            );
            res.status(200).json({ message: "Correo verificado con éxito" });
        } else {
            res.status(400).json({ error: "Código incorrecto" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al verificar" });
    }
});

// --- 7. RUTA MAESTRA: ENVIAR CÓDIGO POR GMAIL ---
app.post('/api/enviar-codigo-email', async (req, res) => {
    const { email } = req.body;
    console.log("Intentando enviar correo a:", email);

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const user = await User.findOneAndUpdate(
            { email: email.trim() }, 
            { codigoVerificacion: codigo },
            { returnDocument: 'after' }
        );
        
        if (!user) return res.status(404).json({ error: "Usuario no registrado" });

        const mailOptions = {
            from: `"Libres Trabaja" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: 'Código de Verificación - Libres Trabaja',
            html: `
                <div style="font-family: sans-serif; text-align: center;">
                    <h2>Tu código de seguridad</h2>
                    <h1 style="color: #4CAF50; font-size: 40px;">${codigo}</h1>
                    <p>Usa este código para verificar tu cuenta en la App.</p>
                </div>
            `
        };

        // Enviamos el correo
        await transporter.sendMail(mailOptions);
        
        console.log("¡Código enviado exitosamente vía Gmail!");
        res.status(200).json({ message: "Código enviado" });

    } catch (error) {
        console.error("Fallo Gmail:", error.message);
        // Respuesta de respaldo: Si falla el envío, informamos pero no bloqueamos el flujo
        res.status(500).json({ 
            error: "Error al enviar el correo", 
            details: "Gmail rechazó la conexión desde el servidor." 
        });
    }
});

// --- 8. REGISTRO, LOGIN Y UPLOAD ---

app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new User(req.body);
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        res.status(400).json({ error: "El correo ya está registrado." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.trim(), password: password.trim() });
        if (user) {
            res.status(200).json({ 
                message: "Login exitoso",
                rol: user.rol,
                nombres: user.nombre,
                email: user.email,
                verificado: user.verificado
            });
        } else {
            res.status(401).json({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.post('/api/upload', async (req, res) => {
    const { data, folder } = req.body; 
    try {
        const uploadResponse = await cloudinary.uploader.upload(data, {
            folder: `libres_trabaja/${folder}`,
            resource_type: "auto"
        });
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        res.status(500).json({ error: "Error al subir a la nube" });
    }
});

app.put('/api/perfil/update', async (req, res) => {
    const { email, nombres, telefono, fotoPerfil, cvUrl } = req.body;
    try {
        const updateData = {};
        if (nombres) updateData.nombre = nombres; 
        if (telefono) updateData.telefono = telefono;
        if (fotoPerfil) updateData.fotoPerfil = fotoPerfil;
        if (cvUrl) updateData.cvUrl = cvUrl;

        await User.findOneAndUpdate(
            { email: email.trim() }, 
            { $set: updateData },
            { returnDocument: 'after' }
        );
        res.status(200).json({ message: "Perfil actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// --- 9. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Libres Trabaja corriendo en puerto ${PORT}`);
});