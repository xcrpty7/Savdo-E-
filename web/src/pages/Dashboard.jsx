import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, DollarSign, AlertTriangle, PlusCircle, AlertCircle, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as reportsApi from '../api/reports.api';
import * as salesApi from '../api/sales.api';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isDark = useThemeStore((s) => s.isDark);

  const card = isDark ? '#162018' : '#ffffff';
  const bd   = isDark ? 'rgba(36,62,40,0.5)' : 'rgba(198,222,192,0.5)';
  const tx1  = isDark ? '#DBF0DB' : '#182A1A';
  const tx2  = isDark ? 'rgba(219,240,219,0.55)' : 'rgba(60,107,66,0.65)';
  const tx3  = isDark ? 'rgba(219,240,219,0.35)' : 'rgba(122,170,124,0.5)';

  const locale = i18n.language.startsWith('uz') ? 'uz-UZ'
    : i18n.language.startsWith('ru') ? 'ru-RU' : 'en-US';

  function fmt(n) {
    return Number(n || 0).toLocaleString(locale) + ' ' + t('currency');
  }

  const todayStr  = new Date().toISOString().split('T')[0];
  const todayDate = new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const accents = {
    green: { bg: 'rgba(84,188,90,0.12)', icon: '#54BC5A', glow: 'rgba(84,188,90,0.2)' },
    gold:  { bg: 'rgba(201,147,58,0.12)', icon: '#C9933A', glow: 'rgba(201,147,58,0.2)' },
    blue:  { bg: 'rgba(68,171,76,0.12)', icon: '#44AB4C', glow: 'rgba(68,171,76,0.15)' },
  };

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: reportsApi.getSummary,
    refetchInterval: 30000,
  });

  const { data: salesData, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ['sales-today', todayStr],
    queryFn: () => salesApi.getSales({ date: todayStr }),
    refetchInterval: 30000,
  });

  const summary    = summaryData?.data?.data || {};
  const todayStats = summary.today || {};
  const lowStock   = summary.lowStock || [];
  const recentSales = (salesData?.data?.data?.sales || []).slice(0, 5);

  const cardStyle = { background: card, border: `1px solid ${bd}`, borderRadius: 20 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingTop: 4 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: tx3, marginBottom: 4 }}>
            {todayDate}
          </p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: tx1, margin: 0, lineHeight: 1.2 }}>
            Salom, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <Link to="/sales"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 14,
            background: 'linear-gradient(135deg,#2D8B35,#44AB4C)',
            color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700,
            boxShadow: '0 6px 20px rgba(45,139,53,0.35)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
          <PlusCircle size={15} />
          {t('new_sale')}
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {summaryLoading ? [0,1,2].map(i => (
          <div key={i} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ height: 12, width: 90, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : '#E8F4EF' }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : '#F0FAF7' }} />
            </div>
            <div style={{ height: 28, width: 120, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : '#E8F4EF' }} />
          </div>
        )) : summaryError ? (
          <div style={{ gridColumn: 'span 3', ...cardStyle, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={28} color="#f87171" />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: 0 }}>{t('error_loading')}</p>
            <button onClick={() => refetchSummary()} style={{ fontSize: 13, fontWeight: 600, color: '#54BC5A', background: 'none', border: 'none', cursor: 'pointer' }}>{t('retry')}</button>
          </div>
        ) : [
          { label: t('today_sales'),   value: todayStats.salesCount ?? 0, Icon: ShoppingCart, a: 'green' },
          { label: t('today_revenue'), value: fmt(todayStats.totalRevenue), Icon: DollarSign, a: 'gold' },
          { label: t('today_profit'),  value: fmt(todayStats.totalProfit),  Icon: TrendingUp,  a: 'green' },
        ].map(({ label, value, Icon, a }) => {
          const c = accents[a];
          return (
            <div key={label} style={{ ...cardStyle, padding: 20, transition: 'transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: tx3 }}>
                  {label}
                </span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, boxShadow: `0 0 14px ${c.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={c.icon} />
                </div>
              </div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: tx1, margin: 0 }}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Low stock */}
      {!summaryLoading && lowStock.length > 0 && (
        <div style={{ ...cardStyle, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(201,147,58,0.2)' : '#FBBF24'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${bd}`, background: 'rgba(201,147,58,0.07)' }}>
            <AlertTriangle size={16} color="#C9933A" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#C9933A' }}>{t('low_stock')}</span>
          </div>
          {lowStock.map((p, i) => (
            <div key={p._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < lowStock.length - 1 ? `1px solid ${bd}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.05)' : '#F0FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={13} color={tx3} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: tx1 }}>{p.name}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                background: p.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(201,147,58,0.1)',
                color: p.stock === 0 ? '#f87171' : '#C9933A',
              }}>
                {p.stock} {t(`unit_${p.unit || 'pcs'}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent sales */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${bd}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: tx1 }}>{t('recent_sales')}</span>
          <Link to="/sales" style={{ fontSize: 12, fontWeight: 600, color: '#54BC5A', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#C9933A'}
            onMouseLeave={e => e.target.style.color = '#54BC5A'}>
            {t('view_all')} →
          </Link>
        </div>

        {salesLoading ? [0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${bd}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 13, width: 120, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#E8F4EF' }} />
              <div style={{ height: 10, width: 80, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.05)' : '#F0FAF7' }} />
            </div>
            <div style={{ height: 14, width: 80, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#E8F4EF' }} />
          </div>
        )) : salesError ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <AlertCircle size={26} color="#f87171" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>{t('error_loading')}</p>
            <button onClick={() => refetchSales()} style={{ fontSize: 13, fontWeight: 600, color: '#54BC5A', background: 'none', border: 'none', cursor: 'pointer' }}>{t('retry')}</button>
          </div>
        ) : recentSales.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.04)' : '#F0FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <ShoppingCart size={22} color={tx3} />
            </div>
            <p style={{ fontSize: 13, color: tx3, margin: '0 0 14px' }}>{t('no_sales_today')}</p>
            <Link to="/sales" style={{
              display: 'inline-block', padding: '8px 18px', borderRadius: 10,
              background: isDark ? 'rgba(45,139,53,0.2)' : '#EAF3E5',
              color: '#54BC5A', textDecoration: 'none', fontSize: 12, fontWeight: 700,
              border: `1px solid ${isDark ? 'rgba(45,139,53,0.3)' : '#C6DEC0'}`,
            }}>
              + {t('new_sale')}
            </Link>
          </div>
        ) : recentSales.map((sale, i) => {
          const timeStr = new Date(sale.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={sale._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 20px',
              borderBottom: i < recentSales.length - 1 ? `1px solid ${bd}` : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#F8FCF9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(84,188,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShoppingCart size={14} color="#54BC5A" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: tx1, margin: '0 0 2px' }}>
                    {sale.productName || 'Mahsulot'}
                  </p>
                  <p style={{ fontSize: 11, color: tx3, margin: 0 }}>
                    {sale.quantity} {t(`unit_${sale.unit || 'pcs'}`)} · {timeStr}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#54BC5A', margin: '0 0 2px' }}>
                  +{Number(sale.profit || 0).toLocaleString(locale)} {t('currency')}
                </p>
                <p style={{ fontSize: 11, color: tx3, margin: 0 }}>
                  {Number(sale.totalRevenue || 0).toLocaleString(locale)} {t('currency')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
