const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getQr, verifyQr } = require('../controllers/qrController');
const { qrValidation, orderIdParamValidation } = require('../utils/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);

router.get('/:orderId', orderIdParamValidation, validateRequest, authorize('student'), getQr);
router.post('/verify', authorize('worker', 'admin'), qrValidation, validateRequest, verifyQr);

module.exports = router;
