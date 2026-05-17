const path = require('path');
const User = require(path.join(__dirname, '..', 'models', 'user'));

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            password: password.trim()
        });
        if (!user) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }
        const response = user.toObject();
        delete response.password;
        response.rol = response.rol || 'candidato';
        res.json(response);
    } catch (e) {
        console.log("ERROR LOGIN:", e);
        res.status(500).json({ error: "Error login" });
    }
};

const guardarToken = async (req, res) => {
    try {
        const { email, fcmToken } = req.body;
        await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { $set: { fcmToken: fcmToken } },
            { new: true }
        );
        res.json({ message: "Token guardado" });
    } catch (e) {
        res.status(500).json({ error: "Error token" });
    }
};

const getPerfil = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "Perfil no encontrado" });
        }
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: "Error perfil" });
    }
};

const updatePerfil = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { email: req.body.email.trim().toLowerCase() },
            { $set: req.body },
            { new: true }
        );
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: "Error update perfil" });
    }
};

const registro = async (req, res) => {
    try {
        const { nombre, apellidos, email, telefono, password, role, rol, nombreEmpresa, ubicacion } = req.body;
        const existe = await User.findOne({ email: email.trim().toLowerCase() });
        if (existe) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }
        const rolUsuario = role || rol;
        const nuevo = new User({
            nombre: nombre?.trim(),
            apellidos: apellidos?.trim(),
            email: email.trim().toLowerCase(),
            telefono: telefono?.trim(),
            password: password?.trim(),
            rol: rolUsuario?.trim()?.toLowerCase() || 'candidato',
            empresa: nombreEmpresa?.trim() || '',
            ubicacion: ubicacion?.trim() || ''
        });
        await nuevo.save();
        res.status(201).json({ message: "Usuario registrado", email: nuevo.email, rol: nuevo.rol });
    } catch (e) {
        console.log("ERROR REGISTRO:", e);
        res.status(500).json({ error: "Error registro" });
    }
};

const actualizarToken = async (req, res) => {
    try {
        const { email, fcmToken } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { $set: { fcmToken: fcmToken } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json({ message: "Token actualizado" });
    } catch (e) {
        res.status(500).json({ error: "Error actualizar token" });
    }
};

const updateCurriculum = async (req, res) => {
    try {
        const { email, cvUrl } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { $set: { cvUrl: cvUrl } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: "Error actualizar curriculum" });
    }
};

const eliminarCurriculum = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndUpdate(userId, { $set: { cvUrl: "" } }, { new: true });
        res.json({ message: "Curriculum eliminado" });
    } catch (e) {
        res.status(500).json({ error: "Error eliminar curriculum" });
    }
};

const enviarCodigoEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        user.codigoVerificacion = codigo;
        await user.save();
        console.log(`Código de verificación para ${email}: ${codigo}`);
        res.json({ message: "Código enviado" });
    } catch (e) {
        res.status(500).json({ error: "Error enviar código" });
    }
};

const verificarCodigo = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        if (user.codigoVerificacion === codigo) {
            user.verificado = true;
            user.codigoVerificacion = null;
            await user.save();
            res.json({ message: "Email verificado correctamente" });
        } else {
            res.status(400).json({ error: "Código incorrecto" });
        }
    } catch (e) {
        res.status(500).json({ error: "Error verificar código" });
    }
};

module.exports = {
    login,
    guardarToken,
    getPerfil,
    updatePerfil,
    registro,
    actualizarToken,
    updateCurriculum,
    eliminarCurriculum,
    enviarCodigoEmail,
    verificarCodigo
};