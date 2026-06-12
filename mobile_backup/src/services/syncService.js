import * as Network from 'expo-network';
import apiClient from './api';
import {
  getPendingSync,
  markSynced,
  markFailed,
  incrementAttempts,
} from '../database/syncQueries';
import { upsertProduct } from '../database/productQueries';
import { createSale } from '../database/saleQueries';
import { getLastSyncAt, setLastSyncAt } from '../database/db';

export const isOnline = async () => {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected && state.isInternetReachable;
  } catch {
    return false;
  }
};

/**
 * Push pending offline operations to server via /sync/push
 */
export const syncPending = async () => {
  const online = await isOnline();
  if (!online) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  try {
    const pendingItems = await getPendingSync();
    if (pendingItems.length === 0) return { synced: 0, failed: 0 };

    // Increment attempts for all
    for (const item of pendingItems) {
      await incrementAttempts(item.id);
    }

    const operations = pendingItems.map(item => ({
      operation: item.operation,
      entity: item.entity,
      entityId: item.entityId,
      payload: typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload,
      clientUpdatedAt: item.createdAt,
    }));

    const response = await apiClient.post('/sync/push', { operations });
    const results = response.data?.results || [];

    for (let i = 0; i < pendingItems.length; i++) {
      const result = results[i];
      if (result?.status === 'synced') {
        await markSynced(pendingItems[i].id);
        synced++;
      } else {
        await markFailed(pendingItems[i].id);
        failed++;
      }
    }
  } catch (error) {
    console.error('syncPending error:', error);
    failed++;
  }

  return { synced, failed };
};

/**
 * Pull updated data from server since last sync.
 * Merges products and sales into local AsyncStorage.
 */
export const pullServerData = async () => {
  const online = await isOnline();
  if (!online) return;

  try {
    const lastSyncAt = await getLastSyncAt();
    const params = lastSyncAt ? { lastSyncAt } : {};

    const response = await apiClient.get('/sync/pull', { params });
    const { products = [], sales = [], serverTime } = response.data?.data || response.data || {};

    for (const product of products) {
      await upsertProduct({
        id: product.id || product.id,
        serverId: product.id || product.id,
        name: product.name,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        quantity: product.stock ?? product.quantity ?? 0,
        unit: product.unit || 'pcs',
        updatedAt: product.updatedAt || new Date().toISOString(),
        isActive: product.isActive !== false,
        synced: 1,
      });
    }

    for (const sale of sales) {
      await createSale({
        id: sale.id || sale.id,
        serverId: sale.id || sale.id,
        productId: sale.product || sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        sellPrice: sale.sellPrice,
        buyPrice: sale.buyPrice,
        totalRevenue: sale.totalRevenue,
        totalCost: sale.totalCost,
        profit: sale.profit,
        note: sale.note || '',
        createdAt: sale.createdAt,
        synced: 1,
      });
    }

    if (serverTime) {
      await setLastSyncAt(serverTime);
    }
  } catch (error) {
    console.error('pullServerData error:', error);
  }
};

/**
 * Full sync: pull first, then push pending.
 */
export const fullSync = async () => {
  await pullServerData();
  return syncPending();
};
