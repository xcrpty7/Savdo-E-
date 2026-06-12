// .env faylidagi EXPO_PUBLIC_API_BASE ni o'zgartiring
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:5000/api/v1';

export const SYNC_INTERVAL = 30000; // 30 seconds
