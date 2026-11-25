const express = require('express');
const router = express.Router();
const {
  searchTrains,
  getAllTrains,
  getTrainDetails,
  createTrain,
  updateTrain,
  deleteTrain,
  updateTrainStatus
} = require('../controllers/trainController');
const { protect, authorize } = require('../middleware/auth');

router.get('/search', searchTrains);
router.get('/', getAllTrains);
router.get('/:identifier', getTrainDetails);

// Admin-only management routes
router.post('/', protect, authorize('admin'), createTrain);
router.put('/:id', protect, authorize('admin'), updateTrain);
router.delete('/:id', protect, authorize('admin'), deleteTrain);
router.patch('/:id/status', protect, authorize('admin'), updateTrainStatus);

module.exports = router;
