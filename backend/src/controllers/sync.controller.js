const Product = require('../models/Product.model');
const Sale = require('../models/Sale.model');
const SyncQueue = require('../models/SyncQueue.model');
const syncService = require('../services/sync.service');
const saleService = require('../services/sale.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const push = asyncHandler(async (req, res) => {
  const { operations } = req.body;
  if (!Array.isArray(operations) || operations.length === 0) {
    return res.status(200).json(new ApiResponse(200, { results: [] }, 'Nothing to sync'));
  }
  const results = await syncService.processSyncBatch(req.user._id, operations);
  res.status(200).json(new ApiResponse(200, { results }, 'Sync push completed'));
});

const pull = asyncHandler(async (req, res) => {
  const lastSyncAt = req.query.lastSyncAt;
  const data = await syncService.pullData(req.user._id, lastSyncAt);
  res.status(200).json(new ApiResponse(200, data, 'Sync pull completed'));
});

// Mobile sync engine calls POST /sync/products with:
// { products: [{ localId, name, buyPrice, sellPrice, stockQty, unit, archivedAt, updatedAt }] }
// Returns: { synced: [{ localId, serverId, name }], conflicts: [...] }
const syncProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(200).json(new ApiResponse(200, { synced: [], conflicts: [] }, 'Nothing to sync'));
  }

  const synced = [];
  const conflicts = [];

  for (const p of products) {
    try {
      const clientTime = p.updatedAt ? new Date(p.updatedAt) : new Date();

      // Try to find existing product by localId mapping
      const existingRecord = await SyncQueue.findOne({
        user: req.user._id,
        entity: 'product',
        entityId: p.localId,
        status: 'synced',
      });

      let product;
      if (existingRecord?.serverEntityId) {
        // Already synced — update if server is older
        product = await Product.findOneAndUpdate(
          { _id: existingRecord.serverEntityId, createdBy: req.user._id, updatedAt: { $lte: clientTime } },
          {
            $set: {
              name: p.name,
              buyPrice: Number(p.buyPrice) || 0,
              sellPrice: Number(p.sellPrice) || 0,
              stock: Number(p.stockQty) || 0,
              unit: p.unit || 'dona',
            },
          },
          { new: true }
        );

        if (!product) {
          // Server is newer → conflict
          product = await Product.findById(existingRecord.serverEntityId);
          conflicts.push({
            localId: p.localId,
            serverId: String(product._id),
            name: product.name,
            buyPrice: product.buyPrice,
            sellPrice: product.sellPrice,
            stockQty: product.stock,
            unit: product.unit,
            serverUpdatedAt: product.updatedAt.getTime(),
          });
          continue;
        }
      } else {
        // New product — create
        product = await Product.findOneAndUpdate(
          { name: p.name, createdBy: req.user._id },
          {
            $setOnInsert: {
              name: p.name,
              buyPrice: Number(p.buyPrice) || 0,
              sellPrice: Number(p.sellPrice) || 0,
              stock: Number(p.stockQty) || 0,
              unit: p.unit || 'dona',
              createdBy: req.user._id,
              owner: req.user._id,
              isActive: p.archivedAt ? false : true,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // Record the sync mapping
      await SyncQueue.findOneAndUpdate(
        { user: req.user._id, entity: 'product', entityId: p.localId },
        {
          user: req.user._id,
          operation: 'create',
          entity: 'product',
          entityId: p.localId,
          serverEntityId: product._id,
          payload: p,
          status: 'synced',
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );

      synced.push({ localId: p.localId, serverId: String(product._id), name: product.name });
    } catch (err) {
      conflicts.push({ localId: p.localId, error: err.message });
    }
  }

  res.status(200).json(new ApiResponse(200, { synced, conflicts }, 'Products sync completed'));
});

// Mobile sync engine calls POST /sync/sales with:
// { sales: [{ localId, productId, productName, qty, sellPrice, profit, note, soldAt, updatedAt }] }
// Returns: { synced: [{ localId, serverId }], conflicts: [...] }
const syncSales = asyncHandler(async (req, res) => {
  const { sales } = req.body;
  if (!Array.isArray(sales) || sales.length === 0) {
    return res.status(200).json(new ApiResponse(200, { synced: [], conflicts: [] }, 'Nothing to sync'));
  }

  const synced = [];
  const conflicts = [];

  for (const s of sales) {
    try {
      // Skip if already synced
      const existing = await Sale.findOne({ syncId: s.localId });
      if (existing) {
        synced.push({ localId: s.localId, serverId: String(existing._id) });
        continue;
      }

      // Map local productId → server productId
      let serverProductId = null;
      if (s.productId) {
        const syncRecord = await SyncQueue.findOne({
          user: req.user._id,
          entity: 'product',
          entityId: s.productId,
          status: 'synced',
        });
        if (syncRecord?.serverEntityId) {
          serverProductId = syncRecord.serverEntityId;
        }
      }

      // Calculate buyPrice from profit and sellPrice
      const qty = Number(s.qty || 0);
      const sellPrice = Number(s.sellPrice || 0);
      const profit = Number(s.profit || 0);
      const buyPrice = qty > 0 ? Math.max(0, sellPrice - profit / qty) : 0;

      const sale = await saleService.createSale(req.user._id, {
        product: serverProductId,
        productName: s.productName || 'Mahsulot',
        quantity: qty,
        sellPrice,
        buyPrice,
        unit: 'pcs',
        note: s.note || '',
        syncId: s.localId,
        productId: s.productId,
        isFromOffline: true,
        createdAt: s.soldAt ? new Date(s.soldAt) : undefined,
      });

      synced.push({ localId: s.localId, serverId: String(sale._id) });
    } catch (err) {
      conflicts.push({ localId: s.localId, error: err.message });
    }
  }

  res.status(200).json(new ApiResponse(200, { synced, conflicts }, 'Sales sync completed'));
});

module.exports = { push, pull, syncProducts, syncSales };
