import { useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  Settings, User, ShieldCheck, LogOut, Menu, TrendingUp,
  Bell, ChevronRight, Sun, Moon, ArrowLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';

const LANGS = [
  { code: 'uz', label: "O'zb" },
  { code: 'ru', label: 'Рус' },
  { code: 'en', label: 'Eng' },
];

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard',  desc: 'Dashboard' },
  { to: '/products',  icon: Package,         labelKey: 'products',   desc: 'Mahsulotlar' },
  { to: '/sales',     icon: ShoppingCart,    labelKey: 'sales',      desc: 'Sotuvlar' },
  { to: '/reports',   icon: BarChart2,       labelKey: 'reports',    desc: 'Hisobotlar' },
  { to: '/settings',  icon: Settings,        labelKey: 'settings',   desc: 'Sozlamalar' },
  { to: '/profile',   icon: User,            labelKey: 'profile',    desc: 'Profil' },
];

function Sidebar({ open, onClose, isDark }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 230, height: '100%',
      background: '#162018',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(36,62,40,0.5)',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 14px 0 18px',
        borderBottom: '1px solid rgba(36,62,40,0.5)', flexShrink: 0,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#2D8B35,#44AB4C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(45,139,53,0.4)', flexShrink: 0,
          }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: '#DBF0DB', letterSpacing: 1 }}>
            SAVDO
          </span>
        </Link>
        <button onClick={onClose} className="md:hidden"
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.45)' }}>
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', marginBottom: 2,
              background: isActive ? 'linear-gradient(135deg,rgba(45,139,53,0.25),rgba(68,171,76,0.12))' : 'transparent',
              color: isActive ? '#DBF0DB' : 'rgba(219,240,219,0.45)',
              fontFamily: 'Syne,sans-serif', fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.15s',
              position: 'relative',
            })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#54BC5A', borderRadius: '0 3px 3px 0' }} />
                )}
                <Icon size={17} />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ padding: '14px 12px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(219,240,219,0.25)' }}>
              Admin
            </div>
            <NavLink to="/admin" onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', marginBottom: 2,
                background: isActive ? 'rgba(201,147,58,0.18)' : 'transparent',
                color: isActive ? '#C9933A' : 'rgba(201,147,58,0.6)',
                fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
              })}>
              <ShieldCheck size={17} />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bosh sahifa linki */}
      <div style={{ padding: '0 8px', marginBottom: 4 }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
          color: 'rgba(219,240,219,0.3)', fontSize: 13,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(219,240,219,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(219,240,219,0.3)'; }}>
          <ArrowLeft size={14} />
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 500 }}>Bosh sahifa</span>
        </Link>
      </div>

      {/* User + logout */}
      <div style={{ borderTop: '1px solid rgba(36,62,40,0.5)', padding: '10px 8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10, marginBottom: 4,
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2D8B35,#44AB4C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#DBF0DB', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#DBF0DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Foydalanuvchi'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(219,240,219,0.4)' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'rgba(219,240,219,0.4)',
            fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(219,240,219,0.4)'; }}>
          <LogOut size={17} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}

function TopBar({ onMenuOpen, isDark, toggle }) {
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) || 'uz';
  const current = NAV.find(n => pathname.startsWith(n.to));

  const bg    = isDark ? '#162018' : '#ffffff';
  const bdr   = isDark ? '1px solid rgba(36,62,40,0.5)' : '1px solid #C6DEC0';
  const text  = isDark ? '#DBF0DB' : '#182A1A';
  const muted = isDark ? 'rgba(219,240,219,0.4)' : '#7AAA7C';
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : '#EAF3E5';
  const btnBd = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #C6DEC0';

  return (
    <header style={{
      height: 64, background: bg, borderBottom: bdr,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuOpen} className="md:hidden"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: 6, borderRadius: 8, display: 'flex' }}>
          <Menu size={22} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted, marginBottom: 1 }}>
            <span>SAVDO</span>
            <ChevronRight size={10} />
            <span style={{ color: '#54BC5A', fontWeight: 600 }}>
              {current ? t(current.labelKey) : 'Dashboard'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, color: text, margin: 0, lineHeight: 1 }}>
            {current?.desc || 'Dashboard'}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Til */}
        <div style={{ display: 'flex', borderRadius: 10, padding: 3, gap: 2, background: isDark ? 'rgba(255,255,255,0.06)' : '#EAF3E5', border: isDark ? '1px solid rgba(36,62,40,0.5)' : '1px solid #C6DEC0' }}>
          {LANGS.map(({ code, label }) => (
            <button key={code} onClick={() => i18n.changeLanguage(code)} style={{
              padding: '5px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
              background: currentLang === code ? '#2D8B35' : 'transparent',
              color: currentLang === code ? '#fff' : (isDark ? 'rgba(219,240,219,0.45)' : '#3C6B42'),
            }}>{label}</button>
          ))}
        </div>

        {/* Tema */}
        <button onClick={toggle} title={isDark ? "Yorug' rejim" : "Qorong'u rejim"}
          style={{ width: 38, height: 38, borderRadius: 10, border: btnBd, cursor: 'pointer', background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#DBF0DB' : '#3C6B42' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Bell */}
        <button style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', background: btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#DBF0DB' : '#3C6B42', position: 'relative' }}>
          <Bell size={16} />
          <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: '#54BC5A', border: `2px solid ${bg}` }} />
        </button>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggleTheme);

  return (
    <div style={{ display: 'flex', height: '100vh', background: isDark ? '#0C1410' : '#F5F8F3', overflow: 'hidden' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar open={true} onClose={() => {}} isDark={isDark} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <Sidebar open={true} onClose={() => setMobileOpen(false)} isDark={isDark} />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar onMenuOpen={() => setMobileOpen(true)} isDark={isDark} toggle={toggle} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
