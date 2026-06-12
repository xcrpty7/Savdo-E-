import { generateId } from '../utils/uuid';
import { getAll, setAll, KEYS } from './db';

export const addToSyncQueue = async (operation, entity, entityId, payload) => {
  const queue = await getAll(KEYS.SYNC_QUEUE);
  const item = {
    id: generateId(),
    operation,
    entity,
    entityId,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  queue.push(item);
  await setAll(KEYS.SYNC_QUEUE, queue);
  return item;
};

export const getPendingSync = async () => {
  const queue = await getAll(KEYS.SYNC_QUEUE);
  return queue
    .filter(i => i.status === 'pending' && i.attempts < 5)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const markSynced = async (id) => {
  const queue = await getAll(KEYS.SYNC_QUEUE);
  const updated = queue.map(i => i.id === id ? { ...i, status: 'synced' } : i);
  await setAll(KEYS.SYNC_QUEUE, updated);
};

export const markFailed = async (id) => {
  const queue = await getAll(KEYS.SYNC_QUEUE);
  const updated = queue.map(i => i.id === id ? { ...i, status: 'failed' } : i);
  await setAll(KEYS.SYNC_QUEUE, updated);
};

export const incrementAttempts = async (id) => {
  const queue = await getAll(KEYS.SYNC_QUEUE);
  const updated = queue.map(i => i.id === id ? { ...i, attempts: (i.attempts || 0) + 1 } : i);
  await setAll(KEYS.SYNC_QUEUE, updated);
};
