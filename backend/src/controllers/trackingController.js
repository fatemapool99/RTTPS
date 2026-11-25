/**
 * RTTPS - Live Tracking & Fleet Positioning Controller
 * Serves real-time GPS telemetry and manages the simulation pipeline.
 */

const { LiveTracking, Train, Station, Schedule, Prediction } = require('../models');
const simulatorService = require('../services/simulatorService');

// @desc    Get live tracking for a specific train
// @route   GET /api/tracking/:trainNumber
// @access  Public
const getTrainTracking = async (req, res) => {
  try {
    const { trainNumber } = req.params;

    const tracking = await LiveTracking.findOne({ trainNumber });
    const train = await Train.findOne({ trainNumber });
    const prediction = await Prediction.findOne({ trainNumber });
    const schedules = await Schedule.find({ trainNumber }).sort({ stopSequence: 1 });

    if (!tracking && !train) {
      return res.status(404).json({ success: false, message: 'Tracking record not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        train: train?.toObject ? train.toObject() : train,
        tracking: tracking?.toObject ? tracking.toObject() : tracking,
        prediction: prediction?.toObject ? prediction.toObject() : prediction,
        schedules
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all active trains' real-time GPS positions for system overview map
// @route   GET /api/tracking/fleet/all
// @access  Public
const getFleetLocations = async (req, res) => {
  try {
    const trackings = await LiveTracking.find({});
    const trains = await Train.find({});

    const trainMap = {};
    trains.forEach(t => {
      const tObj = t.toObject ? t.toObject() : t;
      trainMap[t.trainNumber] = tObj;
    });

    const fleet = trackings.map(trk => {
      const trkObj = trk.toObject ? trk.toObject() : trk;
      return {
        ...trkObj,
        trainName: trainMap[trk.trainNumber]?.trainName || trk.trainNumber,
        sourceStation: trainMap[trk.trainNumber]?.sourceStation,
        destStation: trainMap[trk.trainNumber]?.destStation,
        trainStatus: trainMap[trk.trainNumber]?.trainStatus || 'Running',
        delayMinutes: trainMap[trk.trainNumber]?.delayMinutes || 0
      };
    });

    res.status(200).json({
      success: true,
      count: fleet.length,
      data: fleet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Control simulator (Admin)
// @route   POST /api/tracking/simulation/control
// @access  Private/Admin
const controlSimulator = async (req, res) => {
  try {
    const { action } = req.body; // 'start' | 'stop' | 'restart'

    if (action === 'start') {
      await simulatorService.start();
    } else if (action === 'stop') {
      simulatorService.stop();
    } else if (action === 'restart') {
      simulatorService.stop();
      await simulatorService.initializeTrainStates();
      await simulatorService.start();
    }

    res.status(200).json({
      success: true,
      message: `Simulator service state: ${simulatorService.isRunning ? 'RUNNING' : 'PAUSED'}`,
      isRunning: simulatorService.isRunning
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Inject operational anomaly into simulator (Admin demo trigger)
// @route   POST /api/tracking/simulation/inject
// @access  Private/Admin
const injectAnomaly = async (req, res) => {
  try {
    const { trainNumber, weather, congestion, delayAdded, speed } = req.body;

    const result = simulatorService.injectCondition(trainNumber, {
      weather,
      congestion,
      delayAdded,
      speed
    });

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json({
      success: true,
      message: `Operational anomaly injected for Train ${trainNumber}`,
      data: result.updatedState
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTrainTracking,
  getFleetLocations,
  controlSimulator,
  injectAnomaly
};
