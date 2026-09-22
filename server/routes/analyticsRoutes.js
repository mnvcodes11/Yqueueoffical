const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAnalyticsSummary, getAnalyticsReport, getDigitalTwin } = require('../controllers/analyticsController');
const { analyticsValidation } = require('../utils/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.get('/summary', authorize('admin'), analyticsValidation, validateRequest, getAnalyticsSummary);
router.get('/report', authorize('admin'), analyticsValidation, validateRequest, getAnalyticsReport);
router.get('/digital-twin', authorize('admin'), getDigitalTwin);

module.exports = router;
