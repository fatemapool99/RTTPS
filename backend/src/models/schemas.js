/**
 * RTTPS - Mongoose Schemas Definition
 * Conforms directly to the project architecture specification.
 */

const mongoose = require('mongoose');

// 1. Users Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['passenger', 'admin'], default: 'passenger' },
  phoneNumber: { type: String, default: '' },
  preferredStation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// 2. Stations Schema
const stationSchema = new mongoose.Schema({
  stationCode: { type: String, required: true, unique: true },
  stationName: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  platformsCount: { type: Number, default: 5 },
  zone: { type: String, default: 'NR' }
});

// 3. Trains Schema
const trainSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true, unique: true },
  trainName: { type: String, required: true },
  trainType: { type: String, default: 'Superfast Express' },
  sourceStation: { type: String, required: true },
  destStation: { type: String, required: true },
  sourceName: { type: String, default: '' },
  destName: { type: String, default: '' },
  totalDistanceKm: { type: Number, default: 1000 },
  averageSpeedKmh: { type: Number, default: 80 },
  runningDays: [{ type: String }], // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  trainStatus: { 
    type: String, 
    enum: ['On Time', 'Running', 'Delayed', 'Cancelled', 'Completed'], 
    default: 'On Time' 
  },
  currentSpeed: { type: Number, default: 0 },
  latitude: { type: Number, default: 28.6139 },
  longitude: { type: Number, default: 77.2090 },
  delayMinutes: { type: Number, default: 0 },
  priority: { type: Number, default: 1 }, // 1: Rajdhani/Vande Bharat, 2: Shatabdi/Duronto, 3: Express
  lastUpdated: { type: Date, default: Date.now }
});

// 4. Schedules Schema
const scheduleSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  trainNumber: { type: String, required: true },
  stationCode: { type: String, required: true },
  stationName: { type: String, required: true },
  stopSequence: { type: Number, required: true },
  distanceFromSourceKm: { type: Number, default: 0 },
  scheduledArrival: { type: String, required: true }, // 'HH:MM' or ISO
  scheduledDeparture: { type: String, required: true },
  platformNumber: { type: Number, default: 1 },
  haltMinutes: { type: Number, default: 5 }
});

// 5. LiveTracking Schema
const liveTrackingSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  trainNumber: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  currentStatus: { type: String, default: 'In Transit' },
  lastStationCode: { type: String, default: '' },
  nextStationCode: { type: String, default: '' },
  nextStationName: { type: String, default: '' },
  distanceRemainingKm: { type: Number, default: 0 },
  headingDegrees: { type: Number, default: 0 },
  weatherCondition: { type: String, default: 'Clear' },
  trackCongestion: { type: String, default: 'Low' },
  dataSource: { 
    type: String, 
    enum: ['SIMULATED_GPS', 'IOT_SENSOR', 'ACTUAL_GPS'], 
    default: 'SIMULATED_GPS' 
  },
  timestamp: { type: Date, default: Date.now }
});

// 6. Predictions Schema
const predictionSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  trainNumber: { type: String, required: true },
  stationCode: { type: String, required: true },
  stationName: { type: String, default: '' },
  scheduledArrival: { type: String, default: '' },
  scheduledDeparture: { type: String, default: '' },
  predictedArrival: { type: String, required: true },
  predictedDeparture: { type: String, default: '' },
  estimatedDelayMinutes: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0.90 },
  delaySeverity: { type: String, default: 'On Time' },
  delayFactors: [{ type: String }],
  isOverridden: { type: Boolean, default: false },
  overrideReason: { type: String, default: '' },
  predictionTimestamp: { type: Date, default: Date.now }
});

// 7. Notifications Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: String, default: 'all' }, // 'all' or specific user id
  trainId: { type: String, default: '' },
  trainNumber: { type: String, default: '' },
  notificationType: { 
    type: String, 
    enum: ['DELAY', 'PLATFORM_CHANGE', 'CANCELLATION', 'INFO', 'EMERGENCY'], 
    default: 'INFO' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readStatus: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// 8. HistoricalRecords Schema
const historicalRecordSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  trainNumber: { type: String, required: true },
  stationCode: { type: String, required: true },
  stationName: { type: String, default: '' },
  scheduledArrival: { type: String, required: true },
  actualArrival: { type: String, required: true },
  scheduledDeparture: { type: String, default: '' },
  actualDeparture: { type: String, default: '' },
  delayDurationMinutes: { type: Number, default: 0 },
  weatherCondition: { type: String, default: 'Clear' },
  trackCongestion: { type: String, default: 'Low' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

// Build Mongoose Models
const MongooseModels = {
  User: mongoose.model('User', userSchema),
  Station: mongoose.model('Station', stationSchema),
  Train: mongoose.model('Train', trainSchema),
  Schedule: mongoose.model('Schedule', scheduleSchema),
  LiveTracking: mongoose.model('LiveTracking', liveTrackingSchema),
  Prediction: mongoose.model('Prediction', predictionSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  HistoricalRecord: mongoose.model('HistoricalRecord', historicalRecordSchema),
};

module.exports = {
  MongooseModels
};
