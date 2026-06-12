import { useState, useEffect } from "react";
import { useAuth } from "../../store";
import { useI18n } from "../../i18n";
import { reportsApi } from "../../services/api/reports.api";

const initialReportCards = [];

export function ReportsPage() {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const [from, setFrom] = useState("2026-03-01");
  const [to, setTo] = useState("2026-03-30");
  const [type, setType] = useState("overview");
  const [cards, setCards] = useState(initialReportCards);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatNum = (value) => (typeof value === "number" ? value.toLocaleString() : value);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === "admin-activity") {
        data = await reportsApi.getAdminActivity({ from, to });
        setCards([
          { title: "Umumiy Adminlar", value: formatNum(data.totalAdmins ?? 0), note: "Barcha ro'yxatdan o'tganlar", color: "from-blue-800 via-blue-700 to-blue-800" },
          { title: "Faol Adminlar", value: formatNum(data.activeAdmins ?? 0), note: "Tizimga ruxsati borlar", color: "from-green-800 via-green-700 to-green-800" },
          { title: "Bloklanganlar", value: formatNum((data.totalAdmins || 0) - (data.activeAdmins || 0)), note: "Tizimga kirolmaydiganlar", color: "from-red-800 via-red-700 to-red-800" }
        ]);
      } else if (type === "security") {
        data = await reportsApi.getSecurity({ from, to });
        setCards([
          { title: "Bloklanganlar (Yangi)", value: formatNum(data.blockedUsers ?? 0), note: "Tanlangan davrda bloklangan", color: "from-red-800 via-red-700 to-red-800" },
          { title: "Jami Bloklanganlar", value: formatNum(data.blockedAccounts ?? 0), note: "Umumiy bloklangan foydalanuvchilar", color: "from-orange-800 via-orange-700 to-orange-800" },
          { title: "Xato Kirishlar", value: formatNum(data.failedAttempts ?? 0), note: "Noto'g'ri parol kiritishlar", color: "from-slate-800 via-slate-700 to-slate-800" }
        ]);
      } else {
        data = await reportsApi.getOverview({ from, to });
        setCards([
          { title: "Jami Foydalanuvchilar", value: formatNum(data.totalUsers ?? 0), note: "Tizimda ro'yxatdan o'tganlar", color: "from-blue-800 via-blue-700 to-blue-800" },
          { title: "Jami Daromad", value: formatNum(data.totalRevenue ?? 0) + " so'm", note: "Tasdiqlangan to'lovlar (davr)", color: "from-green-800 via-green-700 to-green-800" },
          { title: "Jami Buyurtmalar", value: formatNum(data.totalOrders ?? 0), note: "Barcha xaridlar soni", color: "from-purple-800 via-purple-700 to-purple-800" }
        ]);
      }
    } catch (err) {
      setError(err?.message || "Serverdan ma'lumot olishda xato");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to, type]);

  return (
    <div className="space-y-5">
      <div className="bg-[#0e2037] rounded-2xl shadow-card border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-white">{t("reports.title")}</h2>
            <p className="text-xs text-white/60 mt-0.5">{t("navigation.pageMeta.reports.eyebrow")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {hasPermission("reports.export") && (
              <button type="button" className="px-4 py-2 text-sm border border-white/20 text-white/90 rounded-xl hover:bg-white/10 transition-colors">
                {t("common.exportCsv")}
              </button>
            )}
            <button type="button" onClick={loadReports} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors">
              {t("common.applyFilter")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-slate-950/50 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400">{t("common.from")}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-400">{t("common.to")}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="overview">{t("reports.overview")}</option>
            <option value="admin-activity">{t("reports.adminActivity")}</option>
            <option value="security">{t("reports.security")}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          {cards.map((card, i) => (
            <div key={i} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 ring-1 ring-white/10 shadow-card`}>
              <p className="text-xs text-white/70 font-medium mb-2">{card.title}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-white/60 mt-2">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="mx-5 mb-5 h-48 bg-slate-900/60 rounded-2xl flex items-center justify-center border border-white/10">
          <div className="text-center">
            {loading ? (
              <p className="text-white/70 text-sm">{t("common.loading") || "Yuklanmoqda..."}</p>
            ) : error ? (
              <p className="text-red-300 text-sm">{error}</p>
            ) : (
              <>
                <p className="text-white/70 text-sm">{t("reports.chartPlaceholder")}</p>
                <p className="text-white/50 text-xs mt-1">{t("reports.chartPlaceholderDescription")}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
