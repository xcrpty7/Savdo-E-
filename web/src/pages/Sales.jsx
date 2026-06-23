import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import * as salesApi from '../api/sales.api';
import * as productsApi from '../api/products.api';

function fmt(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function Sales() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const qc = useQueryClient();

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
    staleTime: 10000,
  });
  const allProducts = productsData?.data?.data?.products || [];
  const inStock = Array.isArray(allProducts) ? allProducts.filter((p) => p.stock > 0) : [];
  const selected = inStock.find((p) => p._id === productId);
  const total = selected ? selected.sellPrice * Number(quantity || 0) : 0;

  const { data: salesData, refetch } = useQuery({
    queryKey: ['sales-today'],
    queryFn: () => salesApi.getSales({ date: new Date().toISOString().split('T')[0] }),
    refetchInterval: 30000,
  });
  const allSales = salesData?.data?.data?.sales || [];
  const sales = Array.isArray(allSales) ? allSales : [];
  const totalRevenue = sales.reduce((s, x) => s + Number(x.totalRevenue || 0), 0);

  const mutation = useMutation({
    mutationFn: salesApi.createSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-today'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Savdo qo\'shildi');
      setProductId('');
      setQuantity('1');
    },
    onError: (err) => {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || 'Xatolik';
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !selected) { toast.error('Mahsulot tanlang'); return; }
    const qty = Number(quantity);
    if (!qty || qty <= 0) { toast.error('Miqdorni kiriting'); return; }
    if (qty > selected.stock) { toast.error(`Zaxirada ${selected.stock} ta qolgan`); return; }
    mutation.mutate({
      product: selected._id,
      productName: selected.name,
      quantity: qty,
      sellPrice: Number(selected.sellPrice) || 0,
      buyPrice: Number(selected.buyPrice) || 0,
      unit: selected.unit || 'pcs',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a1f12]">
      <div className="bg-white dark:bg-[#112920] border-b border-[#E2E8F0] dark:border-white/[0.07] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#e0f2ec]">Savdo</h1>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-xl mx-auto flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#112920] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.07] p-4 flex flex-col gap-3">
          <div className="relative">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-12 rounded-xl border border-[#E2E8F0] dark:border-white/[0.07] px-4 pr-10 text-base bg-white dark:bg-[#112920] text-[#0F172A] dark:text-[#e0f2ec] appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Mahsulot tanlang</option>
              {inStock.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.stock} ta
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[rgba(224,242,236,0.35)] pointer-events-none" />
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Miqdor"
                min="1"
                className="w-full h-12 rounded-xl border border-[#E2E8F0] dark:border-white/[0.07] px-4 text-base bg-white dark:bg-[#112920] text-[#0F172A] dark:text-[#e0f2ec] focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <div className="h-12 rounded-xl bg-[#F1F5F9] dark:bg-white/[0.04] border border-[#E2E8F0] dark:border-white/[0.07] flex items-center px-4 text-base font-bold text-[#0F172A] dark:text-[#e0f2ec]">
                {total > 0 ? fmt(total) : '—'}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Plus size={18} /> Sotish</>
            )}
          </button>
        </form>

        <div className="bg-white dark:bg-[#112920] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.07] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-white/[0.07] flex items-center justify-between">
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#e0f2ec]">Bugungi savdo</span>
            {sales.length > 0 && (
              <span className="text-sm font-bold text-green-600">{fmt(totalRevenue)}</span>
            )}
          </div>
          {sales.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748B] dark:text-[rgba(224,242,236,0.6)]">
              Hali savdo yo'q
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-white/[0.07]">
              {sales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#e0f2ec]">
                      {sale.productName || 'Mahsulot'}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-[rgba(224,242,236,0.6)]">
                      {sale.quantity} × {fmt(Number(sale.totalRevenue || 0) / (sale.quantity || 1))}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-600">{fmt(sale.totalRevenue || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
