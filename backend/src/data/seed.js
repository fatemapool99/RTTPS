/**
 * RTTPS - Database Seeder Script
 * Initializes or resets collections with comprehensive default data.
 */

const { connectDB } = require('../config/db');
const { 
  User, 
  Station, 
  Train, 
  Schedule, 
  LiveTracking, 
  Prediction, 
  Notification, 
  HistoricalRecord 
} = require('../models');
const {
  stationsData,
  trainsData,
  schedulesData,
  liveTrackingInitialData,
  predictionsInitialData,
  notificationsData,
  historicalRecordsData,
  seedUsers
} = require('./seedData');

const runSeeder = async () => {
  console.log('[Seeder] Starting RTTPS database seeding process...');
  await connectDB();

  try {
    // 1. Seed Users
    console.log('[Seeder] Seeding Users...');
    await User.deleteMany({});
    const users = await seedUsers();
    await User.insertMany(users);
    console.log(`[Seeder] Created ${users.length} default users (Admin & Passenger).`);

    // 2. Seed Stations
    console.log('[Seeder] Seeding Stations...');
    await Station.deleteMany({});
    await Station.insertMany(stationsData);
    console.log(`[Seeder] Seeded ${stationsData.length} railway stations.`);

    // 3. Seed Trains
    console.log('[Seeder] Seeding Trains...');
    await Train.deleteMany({});
    const createdTrains = await Train.insertMany(trainsData);
    console.log(`[Seeder] Seeded ${createdTrains.length} express trains.`);

    // Map trainNumber to trainId for reference
    const trainMap = {};
    for (const t of createdTrains) {
      trainMap[t.trainNumber] = t._id;
    }

    // 4. Seed Schedules
    console.log('[Seeder] Seeding Schedules...');
    await Schedule.deleteMany({});
    const schedulesWithIds = schedulesData.map(s => ({
      ...s,
      trainId: trainMap[s.trainNumber] || s.trainNumber
    }));
    await Schedule.insertMany(schedulesWithIds);
    console.log(`[Seeder] Seeded ${schedulesWithIds.length} station timetable stops.`);

    // 5. Seed Live Tracking Initial State
    console.log('[Seeder] Seeding Live Tracking telemetry...');
    await LiveTracking.deleteMany({});
    const trackingWithIds = liveTrackingInitialData.map(trk => ({
      ...trk,
      trainId: trainMap[trk.trainNumber] || trk.trainNumber,
      timestamp: new Date()
    }));
    await LiveTracking.insertMany(trackingWithIds);
    console.log(`[Seeder] Seeded ${trackingWithIds.length} train live tracking records.`);

    // 6. Seed Predictions
    console.log('[Seeder] Seeding Initial ML Predictions...');
    await Prediction.deleteMany({});
    const predictionsWithIds = predictionsInitialData.map(p => ({
      ...p,
      trainId: trainMap[p.trainNumber] || p.trainNumber,
      predictionTimestamp: new Date()
    }));
    await Prediction.insertMany(predictionsWithIds);
    console.log(`[Seeder] Seeded ${predictionsWithIds.length} initial predictions.`);

    // 7. Seed Notifications
    console.log('[Seeder] Seeding Notifications...');
    await Notification.deleteMany({});
    const notifsWithIds = notificationsData.map(n => ({
      ...n,
      trainId: trainMap[n.trainNumber] || n.trainNumber
    }));
    await Notification.insertMany(notifsWithIds);
    console.log(`[Seeder] Seeded ${notifsWithIds.length} system notifications.`);

    // 8. Seed Historical Records
    console.log('[Seeder] Seeding Historical Running Records...');
    await HistoricalRecord.deleteMany({});
    const historyWithIds = historicalRecordsData.map(h => ({
      ...h,
      trainId: trainMap[h.trainNumber] || h.trainNumber
    }));
    await HistoricalRecord.insertMany(historyWithIds);
    console.log(`[Seeder] Seeded ${historyWithIds.length} historical performance records.`);

    console.log('----------------------------------------------------');
    console.log('[Seeder] RTTPS DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Default Credentials:');
    console.log('  Admin:     admin@rttps.com     / Admin@123');
    console.log('  Passenger: passenger@rttps.com / Passenger@123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('[Seeder] Error during seeding:', err);
  }
};

if (require.main === module) {
  runSeeder().then(() => {
    process.exit(0);
  });
}

module.exports = { runSeeder };
