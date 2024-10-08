const mongoose = require('mongoose');
require('dotenv').config();

const {
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB,
    MONGO_USER,
    MONGO_PASSWORD
} = process.env;

let mongoURL;

if (MONGO_USER && MONGO_PASSWORD) {
  mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
} else {
  mongoURL = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); 
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
