const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getQr, verifyQr } = require('../controllers/qrController');

const router = express.Router();

router.use(protect);

router.get('/:orderId', authorize('student'), getQr);
router.post('/verify', authorize('worker', 'admin'), verifyQr);

module.exports = router;
