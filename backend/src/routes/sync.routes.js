const express = require('express');
const router = express.Router();

const syncController = require('../controllers/sync.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { pushSyncSchema } = require('../validators/sync.validator');

router.use(protect);

router.post('/push', validate(pushSyncSchema), syncController.push);   // Mobile → Server
router.get('/pull', syncController.pull);    // Server → Mobile
router.post('/products', syncController.syncProducts);   // Mobile sync engine
router.post('/sales', syncController.syncSales);         // Mobile sync engine

module.exports = router;
