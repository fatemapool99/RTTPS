/**
 * RTTPS - Railway Analytics & Operational Reporting Controller
 * Computes dashboard KPIs, historical delay patterns, and chart data for Recharts.
 */

const { User, Train, LiveTracking, HistoricalRecord, Prediction, Station } = require('../models');

// @desc    Get dashboard KPI statistics
// @route   GET /api/analytics/dashboard-stats
// @access  Public / Private
const getDashboardStats = async (req, res) => {
  try {
    const totalPassengers = await User.countDocuments({ role: 'passenger' });
    const totalTrains = await Train.countDocuments({});
    const activeTrains = await Train.countDocuments({ trainStatus: { $in: ['Running', 'On Time'] } });
    const delayedTrains = await Train.countDocuments({ trainStatus: 'Delayed' });
    const cancelledTrains = await Train.countDocuments({ trainStatus: 'Cancelled' });
    const trackedTrains = await LiveTracking.countDocuments({});

    // Calculate fleet average delay & on-time performance
    const trains = await Train.find({});
    let totalDelay = 0;
    let onTimeCount = 0;

    trains.forEach(t => {
      totalDelay += Number(t.delayMinutes || 0);
      if (Number(t.delayMinutes || 0) <= 5 && t.trainStatus !== 'Cancelled') {
        onTimeCount++;
      }
    });

    const avgDelayMinutes = trains.length > 0 ? Math.round(totalDelay / trains.length) : 0;
    const punctualityPercentage = trains.length > 0 ? Math.round((onTimeCount / trains.length) * 100) : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalPassengers,
        totalTrains,
        activeTrains,
        delayedTrains,
        cancelledTrains,
        trackedTrains,
        avgDelayMinutes,
        punctualityPercentage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get chart telemetry for Recharts (Hourly delays, Route performance)
// @route   GET /api/analytics/charts
// @access  Public
const getChartData = async (req, res) => {
  try {
    // 1. Hourly Delay Trend
    const hourlyDelayTrend = [
      { hour: '00:00', avgDelay: 8, scheduledTrains: 4, actualRunning: 4 },
      { hour: '04:00', avgDelay: 12, scheduledTrains: 6, actualRunning: 6 },
      { hour: '08:00', avgDelay: 24, scheduledTrains: 14, actualRunning: 13 },
      { hour: '12:00', avgDelay: 18, scheduledTrains: 12, actualRunning: 12 },
      { hour: '16:00', avgDelay: 29, scheduledTrains: 18, actualRunning: 17 },
      { hour: '20:00', avgDelay: 22, scheduledTrains: 15, actualRunning: 14 },
      { hour: '23:00', avgDelay: 14, scheduledTrains: 8, actualRunning: 8 }
    ];

    // 2. Route Punctuality Comparison
    const routePunctuality = [
      { route: 'NDLS - MMCT (Rajdhani)', onTimeScore: 94, avgDelay: 7.5 },
      { route: 'NDLS - LKO (Shatabdi)', onTimeScore: 82, avgDelay: 16.0 },
      { route: 'NDLS - BSB (Vande Bharat)', onTimeScore: 97, avgDelay: 2.5 },
      { route: 'HWH - BBS (Duronto)', onTimeScore: 89, avgDelay: 9.0 },
      { route: 'NDLS - TVC (Kerala Exp)', onTimeScore: 74, avgDelay: 34.0 }
    ];

    // 3. Delay Causes Distribution
    const delayCauses = [
      { name: 'Junction Congestion', value: 38, fill: '#3B82F6' },
      { name: 'Adverse Weather (Fog/Rain)', value: 26, fill: '#F59E0B' },
      { name: 'Signal Regulation', value: 20, fill: '#10B981' },
      { name: 'Track Maintenance Block', value: 16, fill: '#EC4899' }
    ];

    // 4. Station Congestion & Platform Utilization
    const stationCongestion = [
      { station: 'New Delhi (NDLS)', occupancyPercent: 88, activeTrains: 8, avgHaltMins: 12 },
      { station: 'Kanpur Central (CNB)', occupancyPercent: 79, activeTrains: 5, avgHaltMins: 8 },
      { station: 'Kota Jn (KOTA)', occupancyPercent: 62, activeTrains: 3, avgHaltMins: 10 },
      { station: 'Vadodara (BRC)', occupancyPercent: 71, activeTrains: 4, avgHaltMins: 10 },
      { station: 'Mumbai Central (MMCT)', occupancyPercent: 84, activeTrains: 6, avgHaltMins: 15 }
    ];

    res.status(200).json({
      success: true,
      charts: {
        hourlyDelayTrend,
        routePunctuality,
        delayCauses,
        stationCongestion
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get historical train records and performance logs
// @route   GET /api/analytics/historical-records
// @access  Public
const getHistoricalRecords = async (req, res) => {
  try {
    const { trainNumber, date, minDelay } = req.query;
    let filter = {};

    if (trainNumber) filter.trainNumber = trainNumber;
    if (date) filter.date = date;
    if (minDelay) filter.delayDurationMinutes = { $gte: Number(minDelay) };

    const records = await HistoricalRecord.find(filter).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getChartData,
  getHistoricalRecords
};
