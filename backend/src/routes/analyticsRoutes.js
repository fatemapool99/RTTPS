const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getChartData,
  getHistoricalRecords
} = require('../controllers/analyticsController');

router.get('/dashboard-stats', getDashboardStats);
router.get('/charts', getChartData);
router.get('/historical-records', getHistoricalRecords);

module.exports = router;
