import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { format } from 'date-fns';
import { SIZES } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getDailyStats, getRecentSales } from '../database/saleQueries';
import { isOnline, syncPending, pullServerData } from '../services/syncService';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('UZS');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'MMMM dd, yyyy');

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setCurrency(s.currency || 'UZS');
    };
    load();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [dailyStats, recent, networkStatus] = await Promise.all([
        getDailyStats(today),
        getRecentSales(5),
        isOnline(),
      ]);
      setStats(dailyStats || { totalRevenue: 0, totalCost: 0, totalProfit: 0, salesCount: 0 });
      setRecentSales(recent || []);
      setOnline(networkStatus);
    } catch (error) {
      console.error('Dashboard loadData error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  const handleSync = async () => {
    if (!online) return;
    try {
      await syncPending();
      await pullServerData();
      await loadData();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Savdo</Text>
          <Text style={styles.headerDate}>{todayDisplay}</Text>
        </View>
        <TouchableOpacity style={[styles.syncButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSync}>
          <Ionicons
            name={online ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={22}
            color={online ? colors.accent : colors.warning}
          />
          <Text style={[styles.syncText, { color: online ? colors.accent : colors.warning }]}>
            {online ? t('common.online') : t('common.offline')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={20} color={colors.info} />
          <Text style={styles.statValue}>{stats.salesCount}</Text>
          <Text style={styles.statLabel}>{t('dashboard.salesToday')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cash-outline" size={20} color={colors.accent} />
          <Text style={styles.statValue}>{formatPrice(stats.totalRevenue, currency)}</Text>
          <Text style={styles.statLabel}>{t('dashboard.revenue')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {formatPrice(stats.totalProfit, currency)}
          </Text>
          <Text style={styles.statLabel}>{t('dashboard.profit')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.newSaleButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('NewSale')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.newSaleText}>{t('dashboard.newSale')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addProductButton, { backgroundColor: colors.card, borderColor: colors.accent }]}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.8}
        >
          <Ionicons name="cube-outline" size={22} color={colors.accent} />
          <Text style={[styles.addProductText, { color: colors.accent }]}>{t('dashboard.products')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('dashboard.recentSales')}</Text>
      {recentSales.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={40} color={colors.border} />
          <Text style={styles.emptyText}>{t('dashboard.noSales')}</Text>
          <Text style={styles.emptySubText}>{t('dashboard.noSalesSub')}</Text>
        </View>
      ) : (
        recentSales.map((sale) => (
          <View key={sale.id} style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.saleLeft}>
              <View style={[styles.saleIconWrapper, { backgroundColor: colors.background }]}>
                <Ionicons name="cart-outline" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.saleName} numberOfLines={1}>{sale.productName}</Text>
                <Text style={styles.saleMeta}>
                  {Number(sale.quantity).toFixed(0)} x {formatPrice(sale.sellPrice, currency)}
                  {'  '}
                  <Text style={styles.saleTime}>
                    {format(new Date(sale.createdAt), 'HH:mm')}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={styles.saleRight}>
              <Text style={styles.saleRevenue}>{formatPrice(sale.totalRevenue, currency)}</Text>
              <Text style={[styles.saleProfit, { color: colors.accent }]}>+{formatPrice(sale.profit, currency)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  headerDate: {
    fontSize: SIZES.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  syncText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  statValue: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: SIZES.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  newSaleButton: {
    flex: 2,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newSaleText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  addProductButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  addProductText: {
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  saleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
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
  saleIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleName: {
    color: colors.text,
    fontSize: SIZES.md,
    fontWeight: '600',
    maxWidth: 160,
  },
  saleMeta: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  saleTime: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
  },
  saleRight: {
    alignItems: 'flex-end',
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
});
