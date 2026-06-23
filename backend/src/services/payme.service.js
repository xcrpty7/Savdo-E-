const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');

const PLANS = {
  pro: { price: 2490000, label: 'PRO' },
  biznes: { price: 4990000, label: 'BIZNES' },
};

function jsonRpcError(id, code, message) {
  return { id, error: { code, message } };
}

function jsonRpcResult(id, result) {
  return { id, result };
}

function parseAccount(account) {
  const user_id = account?.user_id;
  const plan = account?.plan;
  if (!user_id || !plan) return null;
  if (!PLANS[plan]) return null;
  return { userId: user_id, plan };
}

async function checkPerformTransaction(id, params) {
  const account = parseAccount(params?.account);
  if (!account) return jsonRpcError(id, -31050, 'Account not found');

  const user = await User.findById(account.userId);
  if (!user) return jsonRpcError(id, -31050, 'User not found');

  const expectedAmount = PLANS[account.plan].price;
  if (Number(params.amount) !== expectedAmount) {
    return jsonRpcError(id, -31001, 'Incorrect amount');
  }

  return jsonRpcResult(id, {
    allow: true,
    detail: {
      receipt_type: 0,
      items: [{
        title: `Savdo — ${PLANS[account.plan].label}`,
        price: expectedAmount,
        count: 1,
        code: `subscription_${account.plan}`,
        package_code: 'subscription',
      }],
    },
  });
}

async function createTransaction(id, params) {
  const account = parseAccount(params?.account);
  if (!account) return jsonRpcError(id, -31050, 'Account not found');

  const existing = await Transaction.findOne({ paymeId: params.id });
  if (existing) {
    if (existing.state === 1) {
      return jsonRpcResult(id, {
        create_time: existing.createTime?.getTime()?.toString(),
        transaction: existing.paymeId.toString(),
        state: existing.state,
      });
    }
    return jsonRpcError(id, -31008, 'Transaction already exists with different state');
  }

  const user = await User.findById(account.userId);
  if (!user) return jsonRpcError(id, -31050, 'User not found');

  const expectedAmount = PLANS[account.plan].price;
  if (Number(params.amount) !== expectedAmount) {
    return jsonRpcError(id, -31001, 'Incorrect amount');
  }

  const now = new Date();
  const tx = await Transaction.create({
    paymeId: params.id,
    paymeTime: params.time?.toString(),
    orderId: `${account.userId}_${account.plan}_${Date.now()}`,
    userId: account.userId,
    plan: account.plan,
    amount: params.amount,
    state: 1,
    createTime: now,
  });

  return jsonRpcResult(id, {
    create_time: now.getTime().toString(),
    transaction: tx.paymeId.toString(),
    state: 1,
  });
}

async function performTransaction(id, params) {
  const tx = await Transaction.findOne({ paymeId: params.id });
  if (!tx) return jsonRpcError(id, -31050, 'Transaction not found');

  if (tx.state === 2) {
    return jsonRpcResult(id, {
      transaction: tx.paymeId.toString(),
      perform_time: tx.performTime?.getTime()?.toString(),
      state: 2,
    });
  }

  if (tx.state !== 1) {
    return jsonRpcError(id, -31008, 'Transaction not in pending state');
  }

  const now = new Date();
  tx.state = 2;
  tx.performTime = now;
  await tx.save();

  const Subscription = require('../models/Subscription.model');
  const durationDays = tx.plan === 'biznes' ? 30 : 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { user: tx.userId },
    { plan: tx.plan, expiresAt, autoRenew: false },
    { upsert: true }
  );

  return jsonRpcResult(id, {
    transaction: tx.paymeId.toString(),
    perform_time: now.getTime().toString(),
    state: 2,
  });
}

async function cancelTransaction(id, params) {
  const tx = await Transaction.findOne({ paymeId: params.id });
  if (!tx) return jsonRpcError(id, -31050, 'Transaction not found');

  if (tx.state === 2) {
    tx.state = -2;
    tx.reason = params.reason || null;
    tx.cancelTime = new Date();
    await tx.save();

    const Subscription = require('../models/Subscription.model');
    await Subscription.findOneAndUpdate(
      { user: tx.userId },
      { plan: 'free', expiresAt: null }
    );

    return jsonRpcResult(id, {
      transaction: tx.paymeId.toString(),
      cancel_time: tx.cancelTime.getTime().toString(),
      state: -2,
    });
  }

  if (tx.state === 1 || tx.state === 0) {
    tx.state = -1;
    tx.reason = params.reason || null;
    tx.cancelTime = new Date();
    await tx.save();

    return jsonRpcResult(id, {
      transaction: tx.paymeId.toString(),
      cancel_time: tx.cancelTime.getTime().toString(),
      state: -1,
    });
  }

  return jsonRpcError(id, -31008, 'Cannot cancel transaction in current state');
}

async function checkTransaction(id, params) {
  const tx = await Transaction.findOne({ paymeId: params.id });
  if (!tx) return jsonRpcError(id, -31050, 'Transaction not found');

  return jsonRpcResult(id, {
    create_time: tx.createTime?.getTime()?.toString(),
    perform_time: tx.performTime?.getTime()?.toString(),
    cancel_time: tx.cancelTime?.getTime()?.toString(),
    transaction: tx.paymeId.toString(),
    state: tx.state,
    reason: tx.reason,
  });
}

async function getStatement(id, params) {
  const from = new Date(Number(params.from));
  const to = new Date(Number(params.to));
  const txs = await Transaction.find({
    createTime: { $gte: from, $lte: to },
    state: { $in: [1, 2, -1, -2] },
  });

  const statements = txs.map((tx) => ({
    id: tx.paymeId,
    time: tx.paymeTime,
    amount: tx.amount,
    account: { user_id: tx.userId.toString(), plan: tx.plan },
    create_time: tx.createTime?.getTime()?.toString(),
    perform_time: tx.performTime?.getTime()?.toString(),
    cancel_time: tx.cancelTime?.getTime()?.toString(),
    transaction: tx.paymeId.toString(),
    state: tx.state,
    reason: tx.reason,
  }));

  return jsonRpcResult(id, statements);
}

async function handlePaymeRequest(body) {
  const { id, method, params } = body;

  switch (method) {
    case 'CheckPerformTransaction':
      return checkPerformTransaction(id, params);
    case 'CreateTransaction':
      return createTransaction(id, params);
    case 'PerformTransaction':
      return performTransaction(id, params);
    case 'CancelTransaction':
      return cancelTransaction(id, params);
    case 'CheckTransaction':
      return checkTransaction(id, params);
    case 'GetStatement':
      return getStatement(id, params);
    default:
      return jsonRpcError(id, -32601, 'Method not found');
  }
}

module.exports = { handlePaymeRequest, PLANS };
