const mongoose = require('mongoose');

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log('✅ MongoDB conectado');

    } catch (error) {

        console.log('❌ Error MongoDB:', error);

    }
};

module.exports = connectDB;