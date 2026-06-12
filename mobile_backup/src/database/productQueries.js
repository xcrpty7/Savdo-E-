import { getAll, setAll, KEYS } from './db';

export const getAllProducts = async () => {
  const products = await getAll(KEYS.PRODUCTS);
  return products.filter(p => p.isActive !== false).sort((a, b) => a.name.localeCompare(b.name));
};

export const getProductById = async (id) => {
  const products = await getAll(KEYS.PRODUCTS);
  return products.find(p => p.id === id) || null;
};

export const upsertProduct = async (product) => {
  const products = await getAll(KEYS.PRODUCTS);
  const idx = products.findIndex(p => p.id === product.id);
  const updated = {
    id: product.id,
    serverId: product.serverId || null,
    name: product.name,
    buyPrice: product.buyPrice,
    sellPrice: product.sellPrice,
    quantity: product.quantity ?? 0,
    unit: product.unit || 'pcs',
    updatedAt: product.updatedAt || new Date().toISOString(),
    synced: product.synced !== undefined ? product.synced : 0,
    isActive: product.isActive !== false,
  };

  if (idx >= 0) {
    products[idx] = updated;
  } else {
    products.push(updated);
  }
  await setAll(KEYS.PRODUCTS, products);
  return updated;
};

export const updateProductQuantity = async (id, newQty) => {
  const products = await getAll(KEYS.PRODUCTS);
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) {
    products[idx].quantity = newQty;
    products[idx].updatedAt = new Date().toISOString();
    products[idx].synced = 0;
    await setAll(KEYS.PRODUCTS, products);
  }
};

export const deleteProduct = async (id) => {
  const products = await getAll(KEYS.PRODUCTS);
  const updated = products.map(p =>
    p.id === id ? { ...p, isActive: false, updatedAt: new Date().toISOString(), synced: 0 } : p
  );
  await setAll(KEYS.PRODUCTS, updated);
};

export const searchProducts = async (query) => {
  const products = await getAll(KEYS.PRODUCTS);
  const q = query.toLowerCase();
  return products
    .filter(p => p.isActive !== false && p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
};
