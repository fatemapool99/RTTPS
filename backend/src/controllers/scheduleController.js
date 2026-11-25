/**
 * RTTPS - Schedule & Platform Management Controller
 * Handles timetables, platform reassignments, and administrative timing overrides.
 */

const { Schedule, Prediction, Notification, Train } = require('../models');

// @desc    Get schedule by train number
// @route   GET /api/schedules/:trainNumber
// @access  Public
const getTrainSchedule = async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const schedules = await Schedule.find({ trainNumber }).sort({ stopSequence: 1 });
    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update platform assignment
// @route   PATCH /api/schedules/:id/platform
// @access  Private/Admin
const updatePlatformNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { platformNumber, notifyPassengers } = req.body;

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: { platformNumber: Number(platformNumber) } },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    // Broadcast notification if requested
    if (notifyPassengers !== false) {
      const train = await Train.findOne({ trainNumber: schedule.trainNumber });
      await Notification.create({
        userId: 'all',
        trainNumber: schedule.trainNumber,
        notificationType: 'PLATFORM_CHANGE',
        title: `Platform Update: ${schedule.stationName}`,
        message: `Train ${schedule.trainNumber} (${train?.trainName || ''}) will now arrive on Platform #${platformNumber} at ${schedule.stationName}.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Platform updated to #${platformNumber} for ${schedule.stationName}`,
      data: schedule
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Administrative ETA Override (Module requirement 4 & 6)
// @route   POST /api/schedules/override-eta
// @access  Private/Admin
const overrideEstimatedTime = async (req, res) => {
  try {
    const { trainNumber, stationCode, overrideArrival, overrideDelayMinutes, reason } = req.body;

    if (!trainNumber || !stationCode) {
      return res.status(400).json({
        success: false,
        message: 'trainNumber and stationCode are required.'
      });
    }

    const prediction = await Prediction.findOneAndUpdate(
      { trainNumber },
      {
        $set: {
          predictedArrival: overrideArrival,
          estimatedDelayMinutes: Number(overrideDelayMinutes || 0),
          isOverridden: true,
          overrideReason: reason || 'Manual Admin Intervention',
          delaySeverity: Number(overrideDelayMinutes || 0) > 15 ? 'Delayed' : 'On Time'
        }
      },
      { new: true, upsert: true }
    );

    // Update train state delay
    await Train.findOneAndUpdate(
      { trainNumber },
      { $set: { delayMinutes: Number(overrideDelayMinutes || 0) } }
    );

    // Create notification
    await Notification.create({
      userId: 'all',
      trainNumber,
      notificationType: 'INFO',
      title: `Operational Timing Adjustment: Train ${trainNumber}`,
      message: `Train ${trainNumber} timing at ${stationCode} has been officially updated to ${overrideArrival} (Est Delay: ${overrideDelayMinutes}m). Reason: ${reason || 'Traffic Control Override'}.`
    });

    res.status(200).json({
      success: true,
      message: 'Timing successfully overridden by Railway Administration',
      data: prediction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTrainSchedule,
  updatePlatformNumber,
  overrideEstimatedTime
};
