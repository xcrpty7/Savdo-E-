import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { format, subDays } from 'date-fns';
import { SIZES } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import {
  getSalesByDate,
  getSalesByMonth,
  getDailyStats,
  getMonthlyStats,
} from '../database/saleQueries';

const TAB_SALES = 'sales';
const TAB_REPORTS = 'reports';

export default function SalesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState(TAB_SALES);
  const [period, setPeriod] = useState('today');
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('UZS');

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setCurrency(s.currency || 'UZS');
    };
    load();
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const loadSales = useCallback(async (p) => {
    setLoading(true);
    try {
      if (p === 'today') {
        const [data, dailyStats] = await Promise.all([
          getSalesByDate(today),
          getDailyStats(today),
        ]);
        setSales(data);
        setStats(dailyStats || { totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
      } else {
        const [data, monthStats] = await Promise.all([
          getSalesByMonth(currentYear, currentMonth),
          getMonthlyStats(currentYear, currentMonth),
        ]);
        setSales(data);
        setStats(monthStats || { totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
      }
    } catch (error) {
      console.error('SalesScreen loadSales error:', error);
    } finally {
      setLoading(false);
    }
  }, [today, currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === TAB_SALES) loadSales(period);
      else setLoading(false);
    }, [loadSales, activeTab, period])
  );

  const groupSalesByDate = (salesList) => {
    const groups = {};
    for (const sale of salesList) {
      const dateKey = sale.createdAt.substring(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(sale);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const grouped = groupSalesByDate(sales);

  const renderSale = (sale) => (
    <View key={sale.id} style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.saleLeft}>
        <View style={[styles.saleIcon, { backgroundColor: colors.background }]}>
          <Ionicons name="cart-outline" size={16} color={colors.accent} />
        </View>
        <View style={styles.saleInfo}>
          <Text style={styles.saleName} numberOfLines={1}>{sale.productName}</Text>
          <Text style={styles.saleMeta}>
            {Number(sale.quantity).toFixed(0)} × {formatPrice(sale.sellPrice, currency)}
            {'  ·  '}
            {format(new Date(sale.createdAt), 'HH:mm')}
          </Text>
          {sale.note ? <Text style={styles.saleNote}>{sale.note}</Text> : null}
        </View>
      </View>
      <View style={styles.saleRight}>
        <Text style={styles.saleRevenue}>{formatPrice(sale.totalRevenue, currency)}</Text>
        <Text style={[styles.saleProfit, { color: colors.accent }]}>+{formatPrice(sale.profit, currency)}</Text>
      </View>
    </View>
  );

  const renderSalesView = () => (
    <>
      <View style={[styles.periodRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'today' && { backgroundColor: colors.accent }]}
          onPress={() => { setPeriod('today'); loadSales('today'); }}
        >
          <Text style={[styles.periodText, period === 'today' && styles.periodTextActive]}>
            {t('reports.daily')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'month' && { backgroundColor: colors.accent }]}
          onPress={() => { setPeriod('month'); loadSales('month'); }}
        >
          <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
            {t('reports.monthly')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.salesCount}</Text>
          <Text style={styles.statLabel}>{t('reports.totalSales')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(stats.totalRevenue, currency)}</Text>
          <Text style={styles.statLabel}>{t('sales.totalRevenue')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {formatPrice(stats.totalProfit, currency)}
          </Text>
          <Text style={styles.statLabel}>{t('sales.totalProfit')}</Text>
        </View>
      </View>

      {grouped.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={56} color={colors.border} />
          <Text style={styles.emptyText}>{t('dashboard.noSales')}</Text>
          <Text style={styles.emptySubText}>
            {period === 'today'
              ? t('dashboard.noSalesSub')
              : 'No sales this month yet.'}
          </Text>
        </View>
      ) : (
        grouped.map(([dateKey, dateSales]) => (
          <View key={dateKey} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupDate}>
                {dateKey === today ? t('reports.daily') : format(new Date(dateKey), 'MMMM dd, yyyy')}
              </Text>
              <Text style={styles.groupCount}>{dateSales.length} {t('reports.totalSales')}</Text>
            </View>
            {dateSales.map(renderSale)}
          </View>
        ))
      )}
    </>
  );

  const renderReportsView = () => (
    <ReportsView colors={colors} styles={styles} t={t} currency={currency} />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === TAB_SALES && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab(TAB_SALES)}
        >
          <Text style={[styles.tabText, activeTab === TAB_SALES && styles.tabTextActive]}>
            {t('sales.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === TAB_REPORTS && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab(TAB_REPORTS)}
        >
          <Text style={[styles.tabText, activeTab === TAB_REPORTS && styles.tabTextActive]}>
            {t('reports.title')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : activeTab === TAB_SALES ? (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => renderSalesView()}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {renderReportsView()}
        </ScrollView>
      )}
    </View>
  );
}

function ReportsView({ colors, styles, t, currency }) {
  const [mode, setMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (currentMode, date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const dateStr = format(date, 'yyyy-MM-dd');

      let currentStats, sales;
      if (currentMode === 'day') {
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

      const productMap = {};
      for (const sale of (sales || [])) {
        const key = sale.productName;
        if (!productMap[key]) productMap[key] = { name: key, profit: 0, revenue: 0, count: 0 };
        productMap[key].profit += Number(sale.profit);
        productMap[key].revenue += Number(sale.totalRevenue);
        productMap[key].count += 1;
      }
      setTopProducts(Object.values(productMap).sort((a, b) => b.profit - a.profit).slice(0, 5));

      if (currentMode === 'day') {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(date, i);
          const dayStats = await getDailyStats(format(d, 'yyyy-MM-dd'));
          last7.push({
            label: format(d, 'EEE'),
            value: Number(dayStats?.totalProfit || 0),
            isToday: format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
          });
        }
        setChartData(last7);
      } else {
        const last6 = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
          const ms = await getMonthlyStats(d.getFullYear(), d.getMonth() + 1);
          last6.push({
            label: format(d, 'MMM'),
            value: Number(ms?.totalProfit || 0),
            isToday: d.getMonth() === currentStats.month,
          });
        }
        setChartData(last6);
      }
    } catch (error) {
      console.error('ReportsView loadData error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(mode, selectedDate);
    }, [loadData, mode, selectedDate])
  );

  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (mode === 'day') d.setDate(d.getDate() - 1);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
    loadData(mode, d);
  };

  const handleNext = () => {
    const now = new Date();
    const d = new Date(selectedDate);
    if (mode === 'day') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
    if (d > now) return;
    setSelectedDate(d);
    loadData(mode, d);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const today = new Date();
  const canGoNext = mode === 'day' ? !isToday : selectedDate.getMonth() < today.getMonth() || selectedDate.getFullYear() < today.getFullYear();
  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  if (loading) {
    return <ActivityIndicator color={colors.accent} size="large" style={{ paddingVertical: 60 }} />;
  }

  return (
    <>
      <View style={[styles.periodRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.periodBtn, mode === 'day' && { backgroundColor: colors.accent }]}
          onPress={() => { setMode('day'); loadData('day', selectedDate); }}
        >
          <Text style={[styles.periodText, mode === 'day' && styles.periodTextActive]}>
            {t('reports.daily')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, mode === 'month' && { backgroundColor: colors.accent }]}
          onPress={() => { setMode('month'); loadData('month', selectedDate); }}
        >
          <Text style={[styles.periodText, mode === 'month' && styles.periodTextActive]}>
            {t('reports.monthly')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.dateNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {mode === 'day'
            ? isToday ? t('reports.daily') : format(selectedDate, 'MMMM dd, yyyy')
            : format(selectedDate, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity style={[styles.navBtn, !canGoNext && { opacity: 0.3 }]} onPress={handleNext} disabled={!canGoNext}>
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.text : colors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cash-outline" size={20} color={colors.info} />
          <Text style={styles.statValue}>{formatPrice(stats.totalRevenue, currency)}</Text>
          <Text style={styles.statLabel}>{t('dashboard.revenue')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={20} color={colors.warning} />
          <Text style={styles.statValue}>{formatPrice(stats.totalCost, currency)}</Text>
          <Text style={styles.statLabel}>{t('products.buyPrice')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.accent }]}>{formatPrice(stats.totalProfit, currency)}</Text>
          <Text style={styles.statLabel}>{t('dashboard.profit')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
          <Text style={styles.statValue}>{stats.salesCount}</Text>
          <Text style={styles.statLabel}>{t('reports.totalSales')}</Text>
        </View>
      </View>

      <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>
          {mode === 'day' ? '7-day Profit' : '6-month Profit'}
        </Text>
        <View style={styles.chart}>
          {chartData.map((bar, idx) => {
            const barHeight = Math.max(4, ((bar.value / maxVal) * 120));
            return (
              <View key={idx} style={styles.barWrapper}>
                <Text style={styles.barValueLabel}>{bar.value > 0 ? formatPrice(bar.value, currency) : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: bar.isToday ? colors.accent : colors.border }]} />
                </View>
                <Text style={[styles.barLabel, bar.isToday && { color: colors.accent }]}>{bar.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.topSection}>
        <Text style={styles.sectionTitle}>{t('reports.title')}</Text>
        {topProducts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyText}>No data</Text>
          </View>
        ) : (
          topProducts.map((product, idx) => {
            const pct = topProducts[0].profit > 0 ? (product.profit / topProducts[0].profit) * 100 : 0;
            return (
              <View key={product.name} style={[styles.topProductCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.topProductHeader}>
                  <View style={styles.topProductLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  </View>
                  <View style={styles.topProductRight}>
                    <Text style={[styles.topProductProfit, { color: colors.accent }]}>{formatPrice(product.profit, currency)}</Text>
                    <Text style={styles.topProductCount}>{product.count} {t('reports.totalSales')}</Text>
                  </View>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.background }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  periodRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  emptySubText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  statValue: {
    color: colors.text,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupDate: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  groupCount: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
  },
  saleCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  saleIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleInfo: {
    flex: 1,
  },
  saleName: {
    color: colors.text,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  saleMeta: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  saleNote: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  saleRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  saleRevenue: {
    color: colors.text,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  saleProfit: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dateLabel: {
    color: colors.text,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  chartSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
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
    color: colors.textMuted,
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
    color: colors.textMuted,
    fontSize: SIZES.xs,
  },
  topSection: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  topProductCard: {
    borderRadius: 10,
    borderWidth: 1,
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  topProductName: {
    color: colors.text,
    fontSize: SIZES.md,
    fontWeight: '600',
    flex: 1,
  },
  topProductRight: {
    alignItems: 'flex-end',
  },
  topProductProfit: {
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  topProductCount: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
