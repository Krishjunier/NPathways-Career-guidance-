const mongoose = require('mongoose');
require("dotenv").config();

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('[DB] Using existing Mongoose connection');
    return mongoose.connection;
  }

  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb+srv://gk5139272_db_user:WdcanhvNZbGy9Rb1@cluster0.k05al8h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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
