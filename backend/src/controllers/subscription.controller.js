const subscriptionService = require('../services/subscription.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getMySubscription = asyncHandler(async (req, res) => {
  const sub = await subscriptionService.getMySubscription(req.user._id);
  res.status(200).json(new ApiResponse(200, { subscription: sub }));
});

const createPayment = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const result = await subscriptionService.createPayment(req.user._id, plan);
  res.status(200).json(new ApiResponse(200, result));
});

const demoPayment = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const result = await subscriptionService.handleDemoPayment(req.user._id, plan);
  res.status(200).json(new ApiResponse(200, result, 'Demo payment successful'));
});

module.exports = { getMySubscription, createPayment, demoPayment };
