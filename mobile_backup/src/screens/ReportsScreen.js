import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { COLORS, SIZES } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getDailyStats, getMonthlyStats, getSalesByDate, getSalesByMonth } from '../database/saleQueries';

const MODE_DAY = 'day';
const MODE_MONTH = 'month';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState(MODE_DAY);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('UZS');

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setCurrency(s.currency || 'UZS');
    };
    load();
  }, []);

  const loadData = useCallback(async (currentMode, date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const dateStr = format(date, 'yyyy-MM-dd');

      let currentStats, sales;
      if (currentMode === MODE_DAY) {
        [currentStats, sales] = await Promise.all([
          getDailyStats(dateStr),
          getSalesByDate(dateStr),
        ]);
      } else {
        [currentStats, sales] = await Promise.all([
          getMonthlyStats(year, month),
          getSalesByMonth(year, month),
        ]);
      }

      setStats(currentStats || { totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });

      // Build top products by profit
      const productMap = {};
      for (const sale of (sales || [])) {
        const key = sale.productName;
        if (!productMap[key]) {
          productMap[key] = { name: key, profit: 0, revenue: 0, count: 0 };
        }
        productMap[key].profit += Number(sale.profit);
        productMap[key].revenue += Number(sale.totalRevenue);
        productMap[key].count += 1;
      }
      const sorted = Object.values(productMap).sort((a, b) => b.profit - a.profit);
      setTopProducts(sorted.slice(0, 5));

      // Build chart data for last 7 days (day mode) or last 6 months (month mode)
      if (currentMode === MODE_DAY) {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(date, i);
          const dStr = format(d, 'yyyy-MM-dd');
          const dayStats = await getDailyStats(dStr);
          last7.push({
            label: format(d, 'EEE'),
            value: Number(dayStats?.totalProfit || 0),
            isToday: dStr === format(new Date(), 'yyyy-MM-dd'),
          });
        }
        setChartData(last7);
      } else {
        const last6 = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          const ms = await getMonthlyStats(y, m);
          last6.push({
            label: format(d, 'MMM'),
            value: Number(ms?.totalProfit || 0),
            isToday: m === currentStats.month,
          });
        }
        setChartData(last6);
      }
    } catch (error) {
      console.error('ReportsScreen loadData error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(mode, selectedDate);
    }, [loadData, mode, selectedDate])
  );

  const handleModeChange = (newMode) => {
    setMode(newMode);
    loadData(newMode, selectedDate);
  };

  const handlePrev = () => {
    let newDate;
    if (mode === MODE_DAY) {
      newDate = subDays(selectedDate, 1);
    } else {
      newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    }
    setSelectedDate(newDate);
    loadData(mode, newDate);
  };

  const handleNext = () => {
    const now = new Date();
    let newDate;
    if (mode === MODE_DAY) {
      newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      if (newDate > now) return;
    } else {
      newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      if (newDate > now) return;
    }
    setSelectedDate(newDate);
    loadData(mode, newDate);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isCurrentMonth =
    selectedDate.getFullYear() === new Date().getFullYear() &&
    selectedDate.getMonth() === new Date().getMonth();
  const canGoNext = mode === MODE_DAY ? !isToday : !isCurrentMonth;

  // Chart helpers
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === MODE_DAY && styles.modeBtnActive]}
          onPress={() => handleModeChange(MODE_DAY)}
        >
          <Text style={[styles.modeBtnText, mode === MODE_DAY && styles.modeBtnTextActive]}>
            {t('reports.daily')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === MODE_MONTH && styles.modeBtnActive]}
          onPress={() => handleModeChange(MODE_MONTH)}
        >
          <Text style={[styles.modeBtnText, mode === MODE_MONTH && styles.modeBtnTextActive]}>
            {t('reports.monthly')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
            {mode === MODE_DAY
              ? isToday
                ? `${t('reports.daily')}`
                : format(selectedDate, 'MMMM dd, yyyy')
              : format(selectedDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? COLORS.text : COLORS.border} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <>
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={20} color={COLORS.info} />
              <Text style={styles.statValue}>{formatPrice(stats.totalRevenue, currency)}</Text>
                  <Text style={styles.statLabel}>{t('dashboard.revenue')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="wallet-outline" size={20} color={COLORS.warning} />
                  <Text style={styles.statValue}>{formatPrice(stats.totalCost, currency)}</Text>
                  <Text style={styles.statLabel}>{t('products.buyPrice')}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHighlight]}>
                  <Ionicons name="trending-up-outline" size={20} color={COLORS.accent} />
                  <Text style={[styles.statValue, { color: COLORS.accent }]}>
                    {formatPrice(stats.totalProfit, currency)}
                  </Text>
                  <Text style={styles.statLabel}>{t('dashboard.profit')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="receipt-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.statValue}>{stats.salesCount}</Text>
                  <Text style={styles.statLabel}>{t('reports.totalSales')}</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>
              {mode === MODE_DAY ? `${t('reports.daily')} — ${t('dashboard.profit')}` : `${t('reports.monthly')} — ${t('dashboard.profit')}`}
            </Text>
            <View style={styles.chart}>
              {chartData.map((bar, idx) => {
                const heightPct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
                const barHeight = Math.max(4, (heightPct / 100) * 120);
                return (
                  <View key={idx} style={styles.barWrapper}>
                    <Text style={styles.barValueLabel}>
                      {bar.value > 0 ? formatPrice(bar.value, currency) : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: bar.isToday ? COLORS.accent : COLORS.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, bar.isToday && { color: COLORS.accent }]}>
                      {bar.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top Products */}
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>{t('reports.title')}</Text>
            {topProducts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('reports.title')}</Text>
              </View>
            ) : (
              topProducts.map((product, idx) => {
                const maxProfit = topProducts[0].profit;
                const pct = maxProfit > 0 ? (product.profit / maxProfit) * 100 : 0;
                return (
                  <View key={product.name} style={styles.topProductCard}>
                    <View style={styles.topProductHeader}>
                      <View style={styles.topProductLeft}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.topProductName} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </View>
                      <View style={styles.topProductRight}>
                        <Text style={styles.topProductProfit}>
                          {formatPrice(product.profit, currency)}
                        </Text>
                        <Text style={styles.topProductCount}>{product.count} {t('reports.totalSales')}</Text>
                      </View>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  modeBtnText: {
    color: COLORS.textMuted,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  dateLabel: {
    color: COLORS.text,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statCardHighlight: {
    borderColor: COLORS.accent,
  },
  statValue: {
    color: COLORS.text,
    fontSize: SIZES.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
  },
  chartSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: SIZES.base,
    fontWeight: '700',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValueLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  barTrack: {
    width: '70%',
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    width: '100%',
  },
  barLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
  },
  topSection: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: SIZES.base,
  },
  topProductCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  topProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topProductLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankText: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  topProductName: {
    color: COLORS.text,
    fontSize: SIZES.md,
    fontWeight: '600',
    flex: 1,
  },
  topProductRight: {
    alignItems: 'flex-end',
  },
  topProductProfit: {
    color: COLORS.accent,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  topProductCount: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
  },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
});
