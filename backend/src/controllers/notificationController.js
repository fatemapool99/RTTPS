/**
 * RTTPS - Notification System Controller
 * Handles operational delay advisories, platform changes, and admin broadcasts.
 */

const { Notification } = require('../models');

// @desc    Get passenger notifications (unread count & full list)
// @route   GET /api/notifications
// @access  Public / Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'all';

    const notifications = await Notification.find({
      $or: [{ userId: 'all' }, { userId: userId }]
    }).sort({ timestamp: -1 }).limit(30);

    const unreadCount = notifications.filter(n => !n.readStatus).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Public / Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { readStatus: true } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/notifications/mark-all-read
// @access  Public / Private
const markAllAsRead = async (req, res) => {
  try {
    const list = await Notification.find({});
    for (const item of list) {
      await Notification.findByIdAndUpdate(item._id, { $set: { readStatus: true } });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Broadcast an administrative alert
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastAlert = async (req, res) => {
  try {
    const { title, message, notificationType, trainNumber } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and message for the alert.'
      });
    }

    const doc = await Notification.create({
      userId: 'all',
      trainNumber: trainNumber || '',
      notificationType: notificationType || 'INFO',
      title,
      message,
      readStatus: false,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Notification broadcasted to all passengers',
      data: doc
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAlert
};
