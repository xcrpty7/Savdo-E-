const express = require('express');
const router = express.Router();
const { webhook } = require('../controllers/payme.controller');

router.post('/', webhook);

module.exports = router;
