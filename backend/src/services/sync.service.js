const Product = require('../models/Product.model');
const Sale = require('../models/Sale.model');
const SyncQueue = require('../models/SyncQueue.model');
const saleService = require('./sale.service');
const ApiError = require('../utils/ApiError');

/**
 * Process a batch of offline operations from mobile client.
 * Conflict resolution: latest update wins (based on updatedAt timestamp).
 */
const processSyncBatch = async (userId, operations) => {
  const results = [];

  for (const op of operations) {
    const { operation, entity, entityId, payload, clientUpdatedAt } = op;

    try {
      let serverEntityId;

      if (entity === 'sale' && operation === 'create') {
        const sale = await saleService.createSale(userId, {
          ...payload,
          syncId: entityId,
          isFromOffline: true,
        });
        serverEntityId = sale._id;
      }

      else if (entity === 'product') {
        if (operation === 'create') {
          const { owner, createdBy, _id, ...safePayload } = payload;
          const product = await Product.findOneAndUpdate(
            { name: safePayload.name, createdBy: userId },
            {
              $setOnInsert: {
                ...safePayload,
                createdBy: userId,
                owner: userId,
                isActive: true,
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          serverEntityId = product._id;
        }

        else if (operation === 'update') {
          const clientTime = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date(0);
          const { owner, createdBy, _id, ...safePayload } = payload;
          const product = await Product.findOneAndUpdate(
            { _id: payload.serverId || entityId, createdBy: userId, updatedAt: { $lte: clientTime } },
            { $set: safePayload },
            { new: true }
          );
          if (product) serverEntityId = product._id;
        }

        else if (operation === 'delete') {
          const deleted = await Product.findOneAndUpdate(
            { _id: payload.serverId || entityId, createdBy: userId },
            { isActive: false }
          );
          if (deleted) serverEntityId = deleted._id;
        }
      }

      // Record sync result
      await SyncQueue.findOneAndUpdate(
        { user: userId, entityId },
        {
          user: userId,
          operation,
          entity,
          entityId,
          payload,
          serverEntityId,
          status: 'synced',
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );

      results.push({ entityId, status: 'synced', serverEntityId });
    } catch (err) {
      await SyncQueue.findOneAndUpdate(
        { user: userId, entityId },
        {
          user: userId,
          operation,
          entity,
          entityId,
          payload,
          status: 'failed',
          errorMessage: err.message,
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );
      results.push({ entityId, status: 'failed', error: err.message });
    }
  }

  return results;
};

/**
 * Pull latest data for a user's device (products + recent sales)
 */
const pullData = async (userId, lastSyncAt) => {
  const since = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

  const [products, sales] = await Promise.all([
    Product.find({
      createdBy: userId,
      updatedAt: { $gt: since },
    }).select('-reviews -__v').lean(),
    Sale.find({
      user: userId,
      createdAt: { $gt: since },
    }).select('-__v').lean(),
  ]);

  return {
    products,
    sales,
    serverTime: new Date().toISOString(),
  };
};

module.exports = { processSyncBatch, pullData };
