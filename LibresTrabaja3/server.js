const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Tu cadena de conexión (se mantiene igual)
const MONGO_URI = "mongodb://Ana0112:ana1224@ac-lue7stb-shard-00-00.nt6wyap.mongodb.net:27017,ac-lue7stb-shard-00-01.nt6wyap.mongodb.net:27017,ac-lue7stb-shard-00-02.nt6wyap.mongodb.net:27017/ltrabaja?ssl=true&replicaSet=atlas-8xpo1q-shard-0&authSource=admin&appName=redSocial"; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// --- MODELO ACTUALIZADO ---
const UserSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    email: { type: String, unique: true, required: true }, // Email único para que no se repitan
    telefono: String,
    password: { type: String, required: true }, // <--- AGREGAMOS ESTO
    rol: String,
    nombreEmpresa: String,
    ubicacion: String,
    verificado: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

// Ruta para recibir el registro desde Android
app.post('/api/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        console.log("✅ Nuevo usuario registrado con contraseña:", req.body.email);
        res.status(201).send({ message: "Registro exitoso en la nube" });
    } catch (error) {
        console.error("❌ Error al guardar:", error.message);
        res.status(400).send({ error: "No se pudo guardar el usuario. El correo podría estar duplicado." });
    }
});

// Ruta de Login (Para que la uses más adelante)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.status(200).send({ message: "Login exitoso", rol: user.rol });
        } else {
            res.status(401).send({ error: "Credenciales incorrectas" });
        }
    } catch (error) {
        res.status(500).send({ error: "Error en el servidor" });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

app.post('/api/login', async (req, res) => {
    console.log("Intentando login con:", req.body); // <-- ESTO TE DIRÁ LA VERDAD
    // ... resto del código
});