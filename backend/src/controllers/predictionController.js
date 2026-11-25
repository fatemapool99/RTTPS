/**
 * RTTPS - Machine Learning Prediction Controller
 * Bridges Node.js backend with Python ML services and serves prediction telemetry.
 */

const { Prediction, Train, LiveTracking } = require('../models');
const mlService = require('../services/mlService');

// @desc    Get current ML prediction for a train
// @route   GET /api/predictions/:trainNumber
// @access  Public
const getTrainPrediction = async (req, res) => {
  try {
    const { trainNumber } = req.params;

    let prediction = await Prediction.findOne({ trainNumber });
    const train = await Train.findOne({ trainNumber });
    const tracking = await LiveTracking.findOne({ trainNumber });

    if (!prediction && tracking) {
      // Generate prediction dynamically on demand
      const mlPayload = {
        train_number: trainNumber,
        distance_remaining_km: tracking.distanceRemainingKm || 200,
        current_speed_kmh: tracking.speed || 80,
        previous_delay_minutes: train?.delayMinutes || 0,
        weather_condition: tracking.weatherCondition || 'Clear',
        track_congestion: tracking.trackCongestion || 'Low',
        train_priority: train?.priority || 1
      };
      const result = await mlService.getPrediction(mlPayload);

      prediction = await Prediction.create({
        trainId: train?._id || trainNumber,
        trainNumber,
        stationCode: tracking.nextStationCode || '',
        stationName: tracking.nextStationName || '',
        predictedArrival: result.predicted_arrival || 'On Schedule',
        estimatedDelayMinutes: result.estimated_delay_minutes,
        confidenceScore: result.confidence_score,
        delaySeverity: result.status,
        delayFactors: result.delay_factors,
        predictionTimestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Trigger real-time prediction calculation for a train
// @route   POST /api/predictions/calculate
// @access  Public
const calculatePrediction = async (req, res) => {
  try {
    const { trainNumber, currentSpeed, distanceRemaining, previousDelay, weather, congestion } = req.body;

    const train = await Train.findOne({ trainNumber });
    const mlPayload = {
      train_number: trainNumber || '12951',
      distance_remaining_km: Number(distanceRemaining || 250),
      current_speed_kmh: Number(currentSpeed || 85),
      previous_delay_minutes: Number(previousDelay || 0),
      weather_condition: weather || 'Clear',
      track_congestion: congestion || 'Low',
      train_priority: train?.priority || 1
    };

    const prediction = await mlService.getPrediction(mlPayload);

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get ML model metrics, evaluation scores, and feature importances
// @route   GET /api/predictions/metrics/evaluation
// @access  Public
const getModelMetrics = async (req, res) => {
  try {
    const metrics = await mlService.getMetrics();
    const health = await mlService.checkHealth();

    res.status(200).json({
      success: true,
      mlServiceHealth: health,
      metrics
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Trigger model retraining pipeline (Admin only)
// @route   POST /api/predictions/retrain
// @access  Private/Admin
const retrainModel = async (req, res) => {
  try {
    const result = await mlService.triggerRetrain();
    res.status(200).json({
      success: true,
      message: 'Model retrained successfully with fresh operational records',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTrainPrediction,
  calculatePrediction,
  getModelMetrics,
  retrainModel
};
