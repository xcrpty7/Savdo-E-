import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { format } from 'date-fns';
import { SIZES, FONTS } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getDailyStats, getRecentSales } from '../database/saleQueries';
import { isOnline, syncPending, pullServerData } from '../services/syncService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
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

  const StatItem = ({ title, value, icon, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statTitle, { color: colors.textMuted }]}>{title}</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: colors.textMuted }]}>Xayrli kun!</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
          </View>
          <TouchableOpacity 
            style={[styles.syncBadge, { backgroundColor: online ? colors.primary + '10' : colors.warning + '10' }]} 
            onPress={handleSync}
          >
            <View style={[styles.dot, { backgroundColor: online ? colors.primary : colors.warning }]} />
            <Text style={[styles.syncText, { color: online ? colors.primary : colors.warning }]}>
              {online ? t('common.online') : t('common.offline')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatItem 
            title={t('dashboard.salesToday')} 
            value={stats.salesCount} 
            icon="receipt" 
            color="#6366f1" 
          />
          <StatItem 
            title={t('dashboard.revenue')} 
            value={formatPrice(stats.totalRevenue, currency)} 
            icon="wallet" 
            color="#22c55e" 
          />
          <StatItem 
            title={t('dashboard.profit')} 
            value={formatPrice(stats.totalProfit, currency)} 
            icon="trending-up" 
            color="#3b82f6" 
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NewSale')}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>{t('dashboard.newSale')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Products')}
          >
            <Ionicons name="cube" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('dashboard.products')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.recentSales')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SalesStack')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Barchasi</Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('dashboard.noSales')}</Text>
          </Card>
        ) : (
          recentSales.map((sale) => (
            <Card key={sale.id} style={styles.saleCard}>
              <View style={styles.saleLeft}>
                <View style={[styles.saleIconBg, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="bag-handle" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saleName, { color: colors.text }]} numberOfLines={1}>{sale.productName}</Text>
                  <Text style={[styles.saleTime, { color: colors.textMuted }]}>
                    {format(new Date(sale.createdAt), 'HH:mm')} • {Number(sale.quantity).toFixed(0)} dona
                  </Text>
                </View>
              </View>
              <View style={styles.saleRight}>
                <Text style={[styles.salePrice, { color: colors.text }]}>{formatPrice(sale.totalRevenue, currency)}</Text>
                <Text style={[styles.saleProfit, { color: '#22c55e' }]}>+{formatPrice(sale.profit, currency)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerGreeting: {
    fontSize: SIZES.sm,
    ...FONTS.medium,
  },
  headerTitle: {
    fontSize: 28,
    ...FONTS.bold,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 12,
    ...FONTS.semibold,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 12,
    ...FONTS.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    ...FONTS.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
  },
  seeAllText: {
    fontSize: 14,
    ...FONTS.semibold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    ...FONTS.bold,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
  },
  saleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  saleIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleName: {
    fontSize: 15,
    ...FONTS.semibold,
  },
  saleTime: {
    fontSize: 12,
    marginTop: 2,
  },
  saleRight: {
    alignItems: 'flex-end',
  },
  salePrice: {
    fontSize: 15,
    ...FONTS.bold,
  },
  saleProfit: {
    fontSize: 12,
    ...FONTS.semibold,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    ...FONTS.medium,
  }
});
