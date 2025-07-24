const mongoose = require('mongoose');

const ConnectionString = process.env.MONGO_URI

async function connectToDatabase() {
    await mongoose.connect(ConnectionString)
    console.log("Connected to MongoDB");
}

module.exports = connectToDatabase;