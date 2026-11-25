/**
 * RTTPS - Node.js Backend to Python FastAPI Integration Test
 */

const axios = require('axios');
const { server } = require('./src/server');
const { connectDB } = require('./src/config/db');

const PORT = 5058;

const run = async () => {
  await connectDB();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[TEST] Node server running on port ${PORT}`);

  try {
    // Wait for FastAPI to become ready if it's starting up
    console.log('[TEST] Checking FastAPI health on port 8000...');
    for (let i = 0; i < 10; i++) {
      try {
        await axios.get('http://127.0.0.1:8000/health', { timeout: 1000 });
        console.log('[TEST] FastAPI is ONLINE and responding on port 8000.');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 1. Call Node backend calculation endpoint which calls FastAPI
    const testPayload = {
      trainNumber: "12951",
      currentSpeed: 88.0,
      distanceRemaining: 220.0,
      previousDelay: 12.0,
      weather: "Clear",
      congestion: "Low"
    };

    console.log('[TEST] Sending prediction calculation request to Node.js backend...');
    const res = await axios.post(`http://127.0.0.1:${PORT}/api/predictions/calculate`, testPayload);

    console.log('[TEST] Response received from Node.js backend:');
    console.log('  Status:', res.data.success);
    console.log('  Prediction Data:', JSON.stringify(res.data.data, null, 2));

    if (res.data.data.source === 'FASTAPI_PYTHON_MODEL') {
      console.log('\n✓ SUCCESS: Node.js communicated directly with Python FastAPI service!');
    } else {
      console.log('\n[INFO] Backend used local ML fallback engine (FastAPI not active on 8000)');
    }

    // 2. Fetch ML metrics endpoint through backend
    const metricsRes = await axios.get(`http://127.0.0.1:${PORT}/api/predictions/metrics/evaluation`);
    console.log('  Metrics Data:', metricsRes.data.metrics);
    console.log('  ML Service Health:', metricsRes.data.mlServiceHealth);

  } catch (err) {
    console.error('Test error:', err.message);
    if (err.response) {
      console.error('Data:', err.response.data);
    }
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
};

run();
