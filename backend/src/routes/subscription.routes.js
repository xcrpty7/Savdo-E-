const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getMySubscription, createPayment, demoPayment } = require('../controllers/subscription.controller');

router.use(protect);

router.get('/', getMySubscription);
router.post('/create-payment', createPayment);
router.post('/demo-payment', demoPayment);

module.exports = router;
