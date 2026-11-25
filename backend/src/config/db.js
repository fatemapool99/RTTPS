/**
 * RTTPS - Railway Time Tracking and Prediction System
 * Database Connection & Dual-Engine Manager
 * Supports native MongoDB via Mongoose and auto-fallback to persistent In-Memory/JSON store.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;
let fallbackStore = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rttps';
  console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);

  try {
    // Attempt Mongoose connection with 2.5s server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    isConnectedToMongo = true;
    console.log('----------------------------------------------------');
    console.log('[DB] SUCCESS: Connected to live MongoDB Database!');
    console.log('----------------------------------------------------');
  } catch (err) {
    isConnectedToMongo = false;
    console.log('----------------------------------------------------');
    console.log('[DB] NOTICE: MongoDB daemon is not running on localhost:27017.');
    console.log('[DB] AUTO-SWITCH: Initializing In-Memory / File-Backed Database Store.');
    console.log('[DB] The system is 100% operational in self-contained store mode!');
    console.log('----------------------------------------------------');
    initFallbackStore();
  }
};

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

const initFallbackStore = () => {
  if (fallbackStore) return;
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      fallbackStore = JSON.parse(content);
      console.log(`[DB] Loaded persisted store from ${DATA_FILE}`);
    } catch (e) {
      fallbackStore = getDefaultCollections();
    }
  } else {
    fallbackStore = getDefaultCollections();
    saveFallbackStore();
  }
};

const getDefaultCollections = () => ({
  users: [],
  stations: [],
  trains: [],
  schedules: [],
  livetracking: [],
  predictions: [],
  notifications: [],
  historicalrecords: []
});

const saveFallbackStore = () => {
  if (!fallbackStore) return;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackStore, null, 2));
  } catch (err) {
    console.error('[DB] Failed to save fallback store:', err.message);
  }
};

module.exports = {
  connectDB,
  isMongoActive: () => isConnectedToMongo,
  getFallbackStore: () => {
    if (!fallbackStore) initFallbackStore();
    return fallbackStore;
  },
  saveFallbackStore
};
