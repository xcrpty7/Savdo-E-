import { useEffect, useState } from "react";
import { useAuth } from "../../store";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { monthlyOrderStats, weeklyUserStats } from "../../constants/mockData";
import { OrderRevenueChart, UserActivityChart } from "./components/StatsChart";
import { http } from "../../services/http";

const toneRing = {
  info: "ring-blue-100 bg-blue-50",
  success: "ring-green-100 bg-green-50",
  warning: "ring-yellow-100 bg-yellow-50",
  danger: "ring-red-100 bg-red-50"
};

const toneText = {
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600"
};

const toneDot = {
  info: "bg-blue-400",
  success: "bg-green-400",
  warning: "bg-yellow-400",
  danger: "bg-red-400"
};

const priorityStyle = {
  high: "bg-red-600 text-white",
  medium: "bg-yellow-500 text-slate-900",
  low: "bg-slate-500 text-white"
};

export function DashboardPage() {
  const { profile } = useAuth();
  const { users, admins, auditLogs, notificationFeed, recentActivity } = useAdminData();
  const { t } = useI18n();

  const [weeklyData, setWeeklyData] = useState(weeklyUserStats);
  const [monthlyData, setMonthlyData] = useState(monthlyOrderStats);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: users.length,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    function fetchStats() {
      http.get("/admin/stats")
        .then((res) => {
          const data = res?.data?.data || res?.data;
          if (data?.weeklyUsers?.length) setWeeklyData(data.weeklyUsers);
          if (data?.monthlyOrders?.length) setMonthlyData(data.monthlyOrders);
          setDashboardStats({
            totalUsers: data?.totalUsers || users.length,
            totalProducts: data?.totalProducts || 0,
            totalOrders: data?.totalOrders || 0,
            totalRevenue: data?.totalRevenue || 0
          });
        })
        .catch(() => {/* fallback to mock data */});
    }
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [users.length]);

  const stats = [
    {
      label: t("dashboard.stats.totalUsers"),
      value: dashboardStats.totalUsers,
      delta: "",
      tone: "info"
    },
    {
      label: t("dashboard.stats.totalProducts"),
      value: dashboardStats.totalProducts,
      delta: "",
      tone: "success"
    },
    {
      label: t("dashboard.stats.totalOrders"),
      value: dashboardStats.totalOrders,
      delta: "",
      tone: "warning"
    },
    {
      label: t("dashboard.stats.totalRevenue"),
      value: dashboardStats.totalRevenue.toLocaleString() + " so'm",
      delta: "",
      tone: "danger"
    }
  ];

  const resolveTranslation = (key) => {
    if (!key) {
      return "";
    }
    if (key.startsWith("dashboard.recentActivity.")) {
      return t(key.replace("dashboard.recentActivity.", "dashboard.recentActivityEntries."));
    }
    return t(key);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0e2037] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t("common.adminPanel")}</p>
          <h2 className="text-xl font-bold">
            {profile?.name}
            {profile?.isPrimary && (
              <span className="ml-2 text-xs font-normal text-primary/80 bg-primary/20 px-2 py-0.5 rounded-full">
                {t("labels.roles.super_admin")}
              </span>
            )}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {profile?.isPrimary ? t("dashboard.superAdminTitle") : t("dashboard.adminTitle")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            t("dashboard.pillCrud"),
            t("dashboard.pillAudit"),
            t("dashboard.pillToast"),
            t("dashboard.pillRoleAware")
          ].map((tag) => (
            <span key={tag} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 ring-1 ring-white/10 bg-slate-900/60 shadow-card`}> 
            <p className="text-xs text-gray-300 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{String(stat.value).padStart(2, "0")}</p>
            <span className={`text-xs font-medium mt-1 inline-block text-white/70`}>{stat.delta}</span>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UserActivityChart data={weeklyData} />
        <OrderRevenueChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t("dashboard.recentActivity")}</h3>
            <span className="text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">{t("common.live")}</span>
          </div>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${toneDot[item.tone] || "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-white">{resolveTranslation(item.titleKey || item.title)}</p>
                  <p className="text-xs text-white/70">{resolveTranslation(item.detailKey || item.detail)}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t("dashboard.notificationsTitle")}</h3>
            <span className="text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">{t("dashboard.priorityFeed")}</span>
          </div>
          <div className="space-y-3">
            {notificationFeed.map((notification) => (
              <div key={notification.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">{resolveTranslation(notification.titleKey || notification.title)}</p>
                  <p className="text-xs text-white/70 mt-0.5">{resolveTranslation(notification.detailKey || notification.detail)}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    priorityStyle[notification.priority] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {t(`labels.priorities.${notification.priority}`, {}, notification.priority)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            labelKey: "users.createUser",
            descKey: "navigation.menu.users.description",
            href: "/users",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          },
          {
            labelKey: "content.title",
            descKey: "navigation.menu.content.description",
            href: "/content",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          },
          {
            labelKey: "audit.title",
            descKey: "navigation.menu.auditLogs.description",
            href: "/audit-logs",
            color: "from-slate-800 via-slate-700 to-slate-800",
            text: "text-white"
          }
        ].map((card) => (
          <a
            key={card.labelKey}
            href={card.href}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 hover:shadow-card transition-shadow group`}
          >
            <p className="font-semibold text-white group-hover:text-primary transition-colors">{t(card.labelKey)}</p>
            <p className="text-xs text-white/70 mt-1">{t(card.descKey)}</p>
            <span className="text-primary text-xs mt-3 inline-block group-hover:translate-x-1 transition-transform">
              {t("common.view")} -
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
