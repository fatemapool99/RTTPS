/**
 * RTTPS - Train Management & Search Controller
 * Handles multi-criteria search, route schedules, and admin CRUD operations.
 */

const { Train, Schedule, Station, LiveTracking, Prediction, Notification } = require('../models');

// @desc    Search and filter trains
// @route   GET /api/trains/search
// @access  Public
const searchTrains = async (req, res) => {
  try {
    const { query, source, destination, status, day } = req.query;
    let filter = {};

    if (query) {
      filter.$or = [
        { trainNumber: { $regex: query, $options: 'i' } },
        { trainName: { $regex: query, $options: 'i' } },
        { sourceName: { $regex: query, $options: 'i' } },
        { destName: { $regex: query, $options: 'i' } },
        { sourceStation: { $regex: query, $options: 'i' } },
        { destStation: { $regex: query, $options: 'i' } },
      ];
    }

    if (source) {
      filter.sourceStation = { $regex: source, $options: 'i' };
    }

    if (destination) {
      filter.destStation = { $regex: destination, $options: 'i' };
    }

    if (status) {
      filter.trainStatus = status;
    }

    if (day) {
      filter.runningDays = { $in: [day] };
    }

    const trains = await Train.find(filter);

    // Fetch tracking and next station info for each train
    const enrichedTrains = await Promise.all(trains.map(async (t) => {
      const trainObj = t.toObject ? t.toObject() : t;
      const tracking = await LiveTracking.findOne({ trainNumber: t.trainNumber });
      const prediction = await Prediction.findOne({ trainNumber: t.trainNumber });
      const schedules = await Schedule.find({ trainNumber: t.trainNumber }).sort({ stopSequence: 1 });

      return {
        ...trainObj,
        tracking: tracking?.toObject ? tracking.toObject() : tracking,
        prediction: prediction?.toObject ? prediction.toObject() : prediction,
        intermediateStationsCount: schedules.length,
        schedules
      };
    }));

    res.status(200).json({
      success: true,
      count: enrichedTrains.length,
      data: enrichedTrains
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all trains (Admin & Catalog)
// @route   GET /api/trains
// @access  Public
const getAllTrains = async (req, res) => {
  try {
    const trains = await Train.find({});
    res.status(200).json({
      success: true,
      count: trains.length,
      data: trains
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed train info by trainNumber or ID
// @route   GET /api/trains/:identifier
// @access  Public
const getTrainDetails = async (req, res) => {
  try {
    const { identifier } = req.params;

    let train = await Train.findOne({ trainNumber: identifier });
    if (!train) {
      train = await Train.findById(identifier);
    }

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    // Get timetable stops
    const schedules = await Schedule.find({ trainNumber: train.trainNumber }).sort({ stopSequence: 1 });
    // Get live tracking
    const tracking = await LiveTracking.findOne({ trainNumber: train.trainNumber });
    // Get ML ETA prediction
    const prediction = await Prediction.findOne({ trainNumber: train.trainNumber });

    const trainObj = train.toObject ? train.toObject() : train;

    res.status(200).json({
      success: true,
      data: {
        ...trainObj,
        schedules,
        tracking: tracking?.toObject ? tracking.toObject() : tracking,
        prediction: prediction?.toObject ? prediction.toObject() : prediction
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new train (Admin only)
// @route   POST /api/trains
// @access  Private/Admin
const createTrain = async (req, res) => {
  try {
    const {
      trainNumber,
      trainName,
      trainType,
      sourceStation,
      destStation,
      sourceName,
      destName,
      totalDistanceKm,
      averageSpeedKmh,
      runningDays,
      priority,
      schedules
    } = req.body;

    if (!trainNumber || !trainName || !sourceStation || !destStation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide trainNumber, trainName, sourceStation, and destStation.'
      });
    }

    const existing = await Train.findOne({ trainNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Train with number ${trainNumber} already exists.`
      });
    }

    // Create train record
    const newTrain = await Train.create({
      trainNumber,
      trainName,
      trainType: trainType || 'Superfast Express',
      sourceStation,
      destStation,
      sourceName: sourceName || sourceStation,
      destName: destName || destStation,
      totalDistanceKm: Number(totalDistanceKm || 800),
      averageSpeedKmh: Number(averageSpeedKmh || 80),
      runningDays: runningDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      priority: Number(priority || 2),
      trainStatus: 'On Time'
    });

    // Create intermediate schedules if provided
    if (Array.isArray(schedules) && schedules.length > 0) {
      const scheduleDocs = schedules.map((s, idx) => ({
        trainId: newTrain._id,
        trainNumber: newTrain.trainNumber,
        stationCode: s.stationCode,
        stationName: s.stationName || s.stationCode,
        stopSequence: idx + 1,
        distanceFromSourceKm: Number(s.distanceFromSourceKm || 0),
        scheduledArrival: s.scheduledArrival || '00:00',
        scheduledDeparture: s.scheduledDeparture || '00:05',
        platformNumber: Number(s.platformNumber || 1),
        haltMinutes: Number(s.haltMinutes || 5)
      }));
      await Schedule.insertMany(scheduleDocs);
    }

    // Create initial live tracking record
    await LiveTracking.create({
      trainId: newTrain._id,
      trainNumber: newTrain.trainNumber,
      latitude: 28.6139,
      longitude: 77.2090,
      speed: 0,
      currentStatus: 'Ready for Departure',
      dataSource: 'SIMULATED_GPS'
    });

    res.status(201).json({
      success: true,
      message: 'Train created successfully',
      data: newTrain
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update existing train (Admin only)
// @route   PUT /api/trains/:id
// @access  Private/Admin
const updateTrain = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Train.findByIdAndUpdate(id, { $set: req.body }, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Train updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete train and related schedules (Admin only)
// @route   DELETE /api/trains/:id
// @access  Private/Admin
const deleteTrain = async (req, res) => {
  try {
    const { id } = req.params;
    const train = await Train.findById(id);

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    await Train.findByIdAndDelete(id);
    await Schedule.deleteMany({ trainNumber: train.trainNumber });
    await LiveTracking.deleteMany({ trainNumber: train.trainNumber });
    await Prediction.deleteMany({ trainNumber: train.trainNumber });

    res.status(200).json({
      success: true,
      message: `Train ${train.trainNumber} and associated schedules removed successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update operational status (e.g. Cancelled, Delayed)
// @route   PATCH /api/trains/:id/status
// @access  Private/Admin
const updateTrainStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainStatus, delayMinutes, reason } = req.body;

    const train = await Train.findByIdAndUpdate(
      id,
      { 
        $set: { 
          trainStatus, 
          delayMinutes: delayMinutes !== undefined ? Number(delayMinutes) : 0 
        } 
      },
      { new: true }
    );

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    // Automatically generate broadcast alert if cancelled or severely delayed
    if (trainStatus === 'Cancelled') {
      await Notification.create({
        userId: 'all',
        trainNumber: train.trainNumber,
        notificationType: 'CANCELLATION',
        title: `Service Cancellation Alert: ${train.trainName}`,
        message: `Train ${train.trainNumber} (${train.trainName}) scheduled from ${train.sourceStation} to ${train.destStation} has been CANCELLED. Reason: ${reason || 'Operational Constraints'}.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Train status updated to ${trainStatus}`,
      data: train
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  searchTrains,
  getAllTrains,
  getTrainDetails,
  createTrain,
  updateTrain,
  deleteTrain,
  updateTrainStatus
};
