import { getAll, setAll, KEYS } from './db';

export const createSale = async (sale) => {
  const sales = await getAll(KEYS.SALES);
  sales.push({ ...sale, synced: sale.synced !== undefined ? sale.synced : 0 });
  await setAll(KEYS.SALES, sales);
  return sale;
};

export const getSalesByDate = async (dateStr) => {
  const sales = await getAll(KEYS.SALES);
  return sales
    .filter(s => s.createdAt.slice(0, 10) === dateStr)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getSalesByMonth = async (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const sales = await getAll(KEYS.SALES);
  return sales
    .filter(s => s.createdAt.slice(0, 7) === prefix)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const sumStats = (sales) => ({
  totalRevenue: sales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0),
  totalCost: sales.reduce((acc, s) => acc + (s.totalCost || 0), 0),
  totalProfit: sales.reduce((acc, s) => acc + (s.profit || 0), 0),
  salesCount: sales.length,
});

export const getDailyStats = async (dateStr) => {
  const sales = await getSalesByDate(dateStr);
  return sumStats(sales);
};

export const getMonthlyStats = async (year, month) => {
  const sales = await getSalesByMonth(year, month);
  return sumStats(sales);
};

export const getRecentSales = async (limit = 5) => {
  const sales = await getAll(KEYS.SALES);
  return sales
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
};
