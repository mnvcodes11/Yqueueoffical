const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAnalyticsSummary, getAnalyticsReport, getDigitalTwin } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);
router.get('/summary', authorize('admin'), getAnalyticsSummary);
router.get('/report', authorize('admin'), getAnalyticsReport);
router.get('/digital-twin', authorize('admin'), getDigitalTwin);

module.exports = router;
