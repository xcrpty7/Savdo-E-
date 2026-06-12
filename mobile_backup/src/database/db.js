/**
 * AsyncStorage-based local store.
 * All data is stored as JSON arrays keyed by entity name.
 *
 * Keys:
 *   @savdo/products      → Product[]
 *   @savdo/sales         → Sale[]
 *   @savdo/sync_queue    → SyncQueueItem[]
 *   @savdo/last_sync_at  → ISO string
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PRODUCTS: '@savdo/products',
  SALES: '@savdo/sales',
  SYNC_QUEUE: '@savdo/sync_queue',
  LAST_SYNC_AT: '@savdo/last_sync_at',
};

export const getAll = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setAll = async (key, items) => {
  await AsyncStorage.setItem(key, JSON.stringify(items));
};

export const getLastSyncAt = async () => {
  return AsyncStorage.getItem(KEYS.LAST_SYNC_AT);
};

export const setLastSyncAt = async (isoString) => {
  await AsyncStorage.setItem(KEYS.LAST_SYNC_AT, isoString);
};

export { KEYS };
export default AsyncStorage;
