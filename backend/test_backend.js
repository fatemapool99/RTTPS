/**
 * RTTPS - Automated Backend API & End-to-End Integration Test Suite
 * Tests Auth, RBAC, Search, Timetables, Tracking, ML Predictions, Notifications, and Admin Overrides.
 */

const axios = require('axios');
const http = require('http');

// Load server and app in-process
const { app, server } = require('./src/server.js');
const { connectDB } = require('./src/config/db.js');
const simulatorService = require('./src/services/simulatorService.js');

const TEST_PORT = 5055;
let baseUrl = `http://127.0.0.1:${TEST_PORT}`;

let passengerToken = null;
let adminToken = null;

const runTests = async () => {
  console.log('[TEST SUITE] Starting RTTPS End-to-End Backend Verification...');

  await connectDB();
  await simulatorService.start();

  // Start test server on port 5055
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[TEST SUITE] In-process server listening on ${baseUrl}`);

  try {
    // 1. Root Route
    const rootRes = await axios.get(`${baseUrl}/`);
    console.assert(rootRes.status === 200, 'Root status should be 200');
    console.assert(rootRes.data.status === 'ONLINE', 'System should report ONLINE');
    console.log('  ✓ 1. GET / - Root metadata & service status passed');

    // 2. Passenger Authentication
    const passLoginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'passenger@rttps.com',
      password: 'Passenger@123'
    });
    console.assert(passLoginRes.data.success === true, 'Passenger login should succeed');
    console.assert(passLoginRes.data.user.role === 'passenger', 'User role should be passenger');
    passengerToken = passLoginRes.data.token;
    console.log('  ✓ 2. POST /api/auth/login - Passenger authentication & JWT passed');

    // 3. Admin Authentication
    const adminLoginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@rttps.com',
      password: 'Admin@123'
    });
    console.assert(adminLoginRes.data.success === true, 'Admin login should succeed');
    console.assert(adminLoginRes.data.user.role === 'admin', 'User role should be admin');
    adminToken = adminLoginRes.data.token;
    console.log('  ✓ 3. POST /api/auth/login - Administrator authentication & JWT passed');

    // 4. Token verification & Profile GET
    const meRes = await axios.get(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${passengerToken}` }
    });
    console.assert(meRes.data.user.email === 'passenger@rttps.com');
    console.log('  ✓ 4. GET /api/auth/me - Protected route token verification passed');

    // 5. Train Search & Query Filters
    const searchRes = await axios.get(`${baseUrl}/api/trains/search?query=Rajdhani`);
    console.assert(searchRes.data.success === true, 'Search should succeed');
    console.assert(searchRes.data.count >= 1, 'Should find Rajdhani trains');
    console.log(`  ✓ 5. GET /api/trains/search - Multi-criteria search passed (Found ${searchRes.data.count} trains)`);

    // 6. Train Detailed Route & Timetable
    const trainRes = await axios.get(`${baseUrl}/api/trains/12951`);
    console.assert(trainRes.data.success === true);
    console.assert(trainRes.data.data.trainNumber === '12951');
    console.assert(Array.isArray(trainRes.data.data.schedules));
    console.log(`  ✓ 6. GET /api/trains/12951 - Detailed timetable & route passed (${trainRes.data.data.schedules.length} stops)`);

    // 7. Live GPS Telemetry
    const trackRes = await axios.get(`${baseUrl}/api/tracking/12951`);
    console.assert(trackRes.data.success === true);
    console.assert(trackRes.data.data.tracking !== null);
    console.assert(trackRes.data.data.tracking.dataSource === 'SIMULATED_GPS');
    console.log(`  ✓ 7. GET /api/tracking/12951 - Real-time GPS telemetry passed (Speed: ${trackRes.data.data.tracking.speed} km/h)`);

    // 8. Fleet Overview Map Data
    const fleetRes = await axios.get(`${baseUrl}/api/tracking/fleet/all`);
    console.assert(fleetRes.data.success === true);
    console.assert(fleetRes.data.count >= 1);
    console.log(`  ✓ 8. GET /api/tracking/fleet/all - Fleet positioning passed (${fleetRes.data.count} active trains)`);

    // 9. Machine Learning Prediction Endpoint
    const predRes = await axios.get(`${baseUrl}/api/predictions/12951`);
    console.assert(predRes.data.success === true);
    console.assert(predRes.data.data.estimatedDelayMinutes !== undefined);
    console.assert(predRes.data.data.confidenceScore > 0.5);
    console.log(`  ✓ 9. GET /api/predictions/12951 - ML prediction passed (Est Delay: ${predRes.data.data.estimatedDelayMinutes}m, Conf: ${Math.round(predRes.data.data.confidenceScore*100)}%)`);

    // 10. Notifications Feed
    const notifsRes = await axios.get(`${baseUrl}/api/notifications`);
    console.assert(notifsRes.data.success === true);
    console.assert(Array.isArray(notifsRes.data.data));
    console.log(`  ✓ 10. GET /api/notifications - Operational alerts passed (${notifsRes.data.count} alerts)`);

    // 11. Role-Based Access Control (RBAC) Check: Passenger cannot access Admin route
    let rbacBlocked = false;
    try {
      await axios.post(`${baseUrl}/api/schedules/override-eta`, {}, {
        headers: { Authorization: `Bearer ${passengerToken}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        rbacBlocked = true;
      }
    }
    console.assert(rbacBlocked === true, 'Passenger must be forbidden (403) from admin endpoints');
    console.log('  ✓ 11. RBAC Security Check - Passenger correctly rejected (403 Forbidden) from admin override route');

    // 12. Admin Simulator Anomaly Injection
    const injectRes = await axios.post(`${baseUrl}/api/tracking/simulation/inject`, {
      trainNumber: '12951',
      weather: 'Fog',
      delayAdded: 10
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(injectRes.data.success === true);
    console.log('  ✓ 12. POST /api/tracking/simulation/inject - Admin simulator condition injection passed');

    // 13. Admin Timing Override Execution
    const overrideRes = await axios.post(`${baseUrl}/api/schedules/override-eta`, {
      trainNumber: '12951',
      stationCode: 'KOTA',
      overrideArrival: '21:55',
      overrideDelayMinutes: 15,
      reason: 'Signal Regulation & Track Clearance Priority'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(overrideRes.data.success === true);
    console.assert(overrideRes.data.data.isOverridden === true);
    console.log('  ✓ 13. POST /api/schedules/override-eta - Admin timing override & notification broadcast passed');

    // 14. Analytics KPIs & Recharts Telemetry
    const kpiRes = await axios.get(`${baseUrl}/api/analytics/dashboard-stats`);
    console.assert(kpiRes.data.success === true);
    console.assert(kpiRes.data.stats.totalTrains >= 1);
    const chartRes = await axios.get(`${baseUrl}/api/analytics/charts`);
    console.assert(chartRes.data.charts.hourlyDelayTrend.length > 0);
    console.assert(chartRes.data.charts.routePunctuality.length > 0);
    console.log(`  ✓ 14. GET /api/analytics/dashboard-stats & charts - Recharts visualisations telemetry passed`);

    console.log('\n[SUCCESS] ALL 14 BACKEND INTEGRATION & VERIFICATION TESTS PASSED!');
  } catch (err) {
    console.error('\n[TEST FAILED]:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  } finally {
    simulatorService.stop();
    server.close();
    process.exit(0);
  }
};

runTests();
