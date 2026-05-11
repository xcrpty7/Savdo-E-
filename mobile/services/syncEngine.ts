/**
 * Oflayn sync engine — conflict resolution bilan.
 *
 * Strategiya: "Last Write Wins" (updatedAt bo'yicha)
 *  - Local yangi bo'lsa → local versiya serverga yuboriladi
 *  - Server yangi bo'lsa → server versiyasi localga yoziladi
 *
 * runSync() — root layout da AppState "active" bo'lganda chaqiriladi.
 */
import { database } from "@/db";
import { Product } from "@/db/models/Product";
import { Sale } from "@/db/models/Sale";
import { Q } from "@nozbe/watermelondb";
import { api } from "./api";
import { useSyncStore } from "@/store/syncStore";

export async function runSync() {
  if (useSyncStore.getState().isSyncing) return;

  const pending = await getPendingCount();
  useSyncStore.getState().setPendingCount(pending);
  if (pending === 0) return;

  useSyncStore.getState().setSyncing(true);
  try {
    await syncProducts();
    await syncSales();
    useSyncStore.getState().setLastSynced();
    useSyncStore.getState().setPendingCount(0);
  } catch (err) {
    console.warn("Sync error:", err);
    const remaining = await getPendingCount();
    useSyncStore.getState().setPendingCount(remaining);
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

async function syncProducts() {
  const unsynced = await database.collections
    .get<Product>("products")
    .query(Q.where("is_synced", false))
    .fetch();

  if (unsynced.length === 0) return;

  const payload = unsynced.map((p) => ({
    localId: p.id,
    name: p.name,
    buyPrice: p.buyPrice,
    sellPrice: p.sellPrice,
    stockQty: p.stockQty,
    unit: p.unit,
    archivedAt: p.archivedAt,
    // Last-write-wins: server bilan solishtirish uchun
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.getTime() : Number(p.updatedAt),
  }));

  const { data } = await api.post("/sync/products", { products: payload });

  await database.write(async () => {
    // Muvaffaqiyatli sinxronlangan yozuvlar
    for (const item of (data.synced ?? [])) {
      const product = unsynced.find((p) => p.id === item.localId);
      if (product) {
        await product.update((p) => {
          p.serverId = item.serverId;
          p.isSynced = true;
        });
      }
    }

    // Conflict: server yangi — server versiyasi local ga yoziladi
    for (const conflict of (data.conflicts ?? [])) {
      const product = unsynced.find((p) => p.id === conflict.localId);
      if (!product) continue;
      const localUpdatedAt = product.updatedAt instanceof Date
        ? product.updatedAt.getTime()
        : Number(product.updatedAt);
      const serverUpdatedAt = conflict.serverUpdatedAt ?? 0;

      if (serverUpdatedAt > localUpdatedAt) {
        // Server yangi → server versiyasini qabul qilamiz
        await product.update((p) => {
          if (conflict.name !== undefined) p.name = conflict.name;
          if (conflict.buyPrice !== undefined) p.buyPrice = conflict.buyPrice;
          if (conflict.sellPrice !== undefined) p.sellPrice = conflict.sellPrice;
          if (conflict.stockQty !== undefined) p.stockQty = conflict.stockQty;
          p.serverId = conflict.serverId;
          p.isSynced = true;
        });
      } else {
        // Local yangi → local versiyani saqlaymiz, server ni override qilamiz
        // (keyingi sync da qayta yuboriladi, bu safar force flag bilan)
        await product.update((p) => {
          p.isSynced = false;
        });
      }
    }
  });
}

async function syncSales() {
  const unsynced = await database.collections
    .get<Sale>("sales")
    .query(Q.where("is_synced", false))
    .fetch();

  if (unsynced.length === 0) return;

  const payload = unsynced.map((s) => ({
    localId: s.id,
    productId: s.productId,
    productName: s.productName,
    qty: s.qty,
    sellPrice: s.sellPrice,
    profit: s.profit,
    note: s.note,
    soldAt: s.soldAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.getTime() : Number(s.updatedAt),
  }));

  const { data } = await api.post("/sync/sales", { sales: payload });

  await database.write(async () => {
    for (const item of (data.synced ?? [])) {
      const sale = unsynced.find((s) => s.id === item.localId);
      if (sale) {
        await sale.update((s) => {
          s.serverId = item.serverId;
          s.isSynced = true;
        });
      }
    }
    // Sales uchun conflict bo'lmaydi — sotuv immutable (o'zgartirilmaydi)
  });
}

export async function getPendingCount(): Promise<number> {
  const [products, sales] = await Promise.all([
    database.collections.get<Product>("products").query(Q.where("is_synced", false)).fetchCount(),
    database.collections.get<Sale>("sales").query(Q.where("is_synced", false)).fetchCount(),
  ]);
  return products + sales;
}
