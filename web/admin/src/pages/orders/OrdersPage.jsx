import { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { ordersApi } from "../../services/api/orders.api";

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  shipped: "bg-purple-500/10 text-purple-400",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500"
};

const PAYMENT_COLORS = {
  pending: "text-yellow-500",
  paid: "text-green-500",
  failed: "text-red-500"
};

export function OrdersPage() {
  const { t } = useI18n();
  usePageTitle(t("navigation.pageMeta.orders.eyebrow"));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await ordersApi.getAll({ limit: 100 });
      setOrders(res.data?.orders || res.data || []);
      setError("");
    } catch (err) {
      if (orders.length === 0) setError("Buyurtmalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    setStatusUpdating(id);
    try {
      await ordersApi.updateStatus(id, newStatus);
      setOrders((curr) => curr.map(o => o.id === id ? { ...o, orderStatus: newStatus } : o));
    } catch (err) {
      alert("Statusni yangilashda xatolik: " + err.message);
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#0e2037] rounded-2xl shadow-card border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">{t("navigation.pageMeta.orders.eyebrow")}</h2>
          <p className="text-xs text-white/60 mt-0.5">{t("navigation.pageMeta.orders.description")}</p>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-white/50">Yuklanmoqda...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">Buyurtma No</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">Mijoz</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">Sana</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">To'lov holati</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">Summa</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/50 uppercase">Buyurtma holati</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-white/40">Buyurtmalar topilmadi</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{o.orderNumber}</td>
                      <td className="px-5 py-3">
                        <p className="text-white">{o.user?.name || "Noma'lum"}</p>
                        <p className="text-xs text-white/50">{o.user?.phone || o.user?.email || ""}</p>
                      </td>
                      <td className="px-5 py-3 text-white/70">
                        {new Date(o.createdAt).toLocaleString("uz-UZ")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-medium ${PAYMENT_COLORS[o.paymentStatus] || "text-white/60"}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-white">
                        {Number(o.totalPrice).toLocaleString("uz-UZ")} so'm
                      </td>
                      <td className="px-5 py-3">
                        <select
                          disabled={statusUpdating === o.id}
                          value={o.orderStatus}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full outline-none appearance-none cursor-pointer border border-transparent hover:border-white/20 transition-colors ${STATUS_COLORS[o.orderStatus] || "bg-gray-100 text-gray-600"}`}
                        >
                          <option value="pending" className="bg-[#0e2037] text-white">Pending</option>
                          <option value="processing" className="bg-[#0e2037] text-white">Processing</option>
                          <option value="shipped" className="bg-[#0e2037] text-white">Shipped</option>
                          <option value="delivered" className="bg-[#0e2037] text-white">Delivered</option>
                          <option value="cancelled" className="bg-[#0e2037] text-white">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
