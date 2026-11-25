const express = require('express');
const router = express.Router();
const {
  getTrainPrediction,
  calculatePrediction,
  getModelMetrics,
  retrainModel
} = require('../controllers/predictionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/metrics/evaluation', getModelMetrics);
router.post('/calculate', calculatePrediction);
router.get('/:trainNumber', getTrainPrediction);

// Admin-only retrain route
router.post('/retrain', protect, authorize('admin'), retrainModel);

module.exports = router;
