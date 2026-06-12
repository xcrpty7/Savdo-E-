import api from './axios';

/**
 * Push offline operations to server.
 * @param {Array} operations
 */
export const syncPush = (operations) => api.post('/sync/push', { operations });

/**
 * Pull updated products/sales from server since lastSyncAt.
 * @param {string|null} lastSyncAt  ISO date string
 */
export const syncPull = (lastSyncAt) =>
  api.get('/sync/pull', { params: lastSyncAt ? { lastSyncAt } : {} });
