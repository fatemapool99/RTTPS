/**
 * RTTPS - Railway Time Tracking and Prediction System
 * Express Backend Server with Socket.IO & Machine Learning Integration
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const { connectDB } = require('./config/db');
const { setupSocketIO } = require('./sockets/socketHandler');
const simulatorService = require('./services/simulatorService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

setupSocketIO(io, simulatorService);

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/tracking/fleet')) {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Root Health & Metadata Route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'Railway Time Tracking and Prediction System (RTTPS)',
    version: '1.0.0',
    status: 'ONLINE',
    author: 'Academic B.Tech Software Engineering Project',
    api_endpoints: {
      auth: '/api/auth',
      trains: '/api/trains',
      schedules: '/api/schedules',
      tracking: '/api/tracking',
      predictions: '/api/predictions',
      notifications: '/api/notifications',
      analytics: '/api/analytics'
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`[RTTPS Backend] Listening on port: ${PORT}`);
    console.log(`[RTTPS Backend] Base URL: http://localhost:${PORT}`);
    console.log('====================================================');

    // Auto-start real-time GPS simulation
    try {
      await simulatorService.start();
    } catch (e) {
      console.warn('[Server] Simulator start notice:', e.message);
    }
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
