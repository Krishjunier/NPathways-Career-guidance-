const mongoose = require('mongoose');
require("dotenv").config();

let isConnected = false;

const connectToDatabase = async () => {
  try {
    if (isConnected) {
      console.log('[DB] Using existing Mongoose connection');
      return mongoose.connection;
    }

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Connect to MongoDB
    await mongoose.connect(dbUri);

    isConnected = true;
    console.log('[DB] Connected to MongoDB via Mongoose');
    return mongoose.connection;
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    throw error;
  }
};

const getDb = () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  return null;
};

module.exports = { connectToDatabase, getDb };
