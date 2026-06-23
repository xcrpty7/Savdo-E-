const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');

const createSale = async (userId, saleData) => {
  const { product: productId, productName, quantity, sellPrice, buyPrice, unit, note, syncId, isFromOffline, createdAt } = saleData;

  if (syncId) {
    const existing = await Sale.findOne({ syncId });
    if (existing) return existing;
  }

  const qty = Number(quantity);
  const sp = Number(sellPrice) || 0;
  const bp = Number(buyPrice) || 0;

  if (productId) {
    const updated = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );
    if (!updated) {
      const product = await Product.findById(productId);
      throw new ApiError(400, `Insufficient stock for "${product?.name || productId}". Available: ${product?.stock ?? 0}`);
    }
  }

  const saleDoc = await Sale.create({
    user: userId,
    product: productId || undefined,
    productName,
    quantity: qty,
    sellPrice: sp,
    buyPrice: bp,
    totalRevenue: qty * sp,
    totalCost: qty * bp,
    profit: qty * sp - qty * bp,
    unit,
    note,
    syncId,
    productId: syncId ? (saleData.productId || syncId) : undefined,
    isFromOffline: isFromOffline || false,
    createdAt: createdAt ? new Date(createdAt) : undefined,
  });

  return saleDoc;
};

const bulkSync = async (userId, sales) => {
  const results = [];
  for (const s of sales) {
    try {
      const sale = await createSale(userId, s);
      results.push({ syncId: s.syncId, serverId: sale._id, status: 'synced' });
    } catch (err) {
      results.push({ syncId: s.syncId, status: 'failed', error: err.message });
    }
  }
  return results;
};

const getSales = async (userId, { page = 1, limit = 100, from, to, date } = {}) => {
  const filter = { user: userId };

  if (date) {
    // Single day filter
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  } else if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Sale.countDocuments(filter),
  ]);

  return { sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

module.exports = { createSale, bulkSync, getSales };
