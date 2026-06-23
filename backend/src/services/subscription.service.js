const Subscription = require('../models/Subscription.model');
const Transaction = require('../models/Transaction.model');
const ApiError = require('../utils/ApiError');
const { PLANS } = require('./payme.service');

async function getMySubscription(userId) {
  let sub = await Subscription.findOne({ user: userId });
  if (!sub) {
    sub = await Subscription.create({ user: userId, plan: 'free' });
  }
  if (sub.expiresAt && sub.expiresAt < new Date()) {
    sub.plan = 'free';
    sub.expiresAt = null;
    await sub.save();
  }
  return sub;
}

async function createPayment(userId, plan) {
  if (!PLANS[plan]) throw new ApiError(400, 'Invalid plan');

  const sub = await getMySubscription(userId);
  if (sub.plan === plan && sub.expiresAt && sub.expiresAt > new Date()) {
    throw new ApiError(400, 'This plan is already active');
  }

  const orderId = `${userId}_${plan}_${Date.now()}`;
  const tx = await Transaction.create({
    orderId,
    userId,
    plan,
    amount: PLANS[plan].price,
    state: 0,
  });

  const merchantId = process.env.PAYME_MERCHANT_ID || 'test_merchant';
  const paymeUrl = `https://checkout.paycom.uz/${merchantId}`;

  return {
    transactionId: tx._id,
    amount: PLANS[plan].price,
    amountUzs: (PLANS[plan].price / 100).toLocaleString(),
    paymeUrl,
    orderId,
  };
}

async function handleDemoPayment(userId, plan) {
  if (!PLANS[plan]) throw new ApiError(400, 'Invalid plan');

  const tx = await Transaction.create({
    orderId: `${userId}_${plan}_demo_${Date.now()}`,
    userId,
    plan,
    amount: PLANS[plan].price,
    state: 2,
    performTime: new Date(),
    createTime: new Date(),
  });

  const durationDays = 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { user: userId },
    { plan, expiresAt, autoRenew: false },
    { upsert: true }
  );

  return { success: true, plan, expiresAt };
}

module.exports = { getMySubscription, createPayment, handleDemoPayment };
