const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAlert
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

// Admin-only alert broadcast
router.post('/broadcast', protect, authorize('admin'), broadcastAlert);

module.exports = router;
