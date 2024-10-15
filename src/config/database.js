const mongoose = require('mongoose');
require('dotenv').config();
//const { GameState, Dragon } = require('./dbModel');

const {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB,
    MONGO_USER,
    MONGO_PASSWORD
} = process.env;

let mongoURL;

const uri = process.env.MONGO_URI;

if (MONGO_USER && MONGO_PASSWORD) {
  mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
} else {
  mongoURL = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
}

console.log("MongoDB URI:", mongoURL);

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log("MongoDB connected successfully");

  } catch (error) {
    console.error("MongoDB connection error:", error);
    setTimeout(connectDB, 5000);
    throw error; // Lanzamos el error para manejarlo en el caller
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
