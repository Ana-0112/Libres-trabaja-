let admin = null;

try {

    admin = require('firebase-admin');

    // Verificar si las variables de entorno están configuradas
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.log("⚠️ Firebase: Variables de entorno no configuradas");
        console.log("   Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env");
    } else if (!admin.apps.length) {

        admin.initializeApp({

            credential: admin.credential.cert({

                projectId: projectId,

                clientEmail: clientEmail,

                privateKey: privateKey.replace(/\\n/g, '\n')

            })

        });

        console.log("🔥 Firebase inicializado correctamente");

    }

} catch (e) {

    console.log("⚠️ Firebase no inicializado:", e.message);

}

module.exports = admin;