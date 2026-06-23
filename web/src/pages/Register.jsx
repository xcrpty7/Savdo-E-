import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

export default function Register() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const register    = useAuthStore((s) => s.register);
  const login       = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const isLoading   = useAuthStore((s) => s.isLoading);
  const navigate    = useNavigate();

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#080f0a';
    return () => { document.body.style.background = prev; };
  }, []);

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const user = await googleLogin(credential);
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role))
        navigate('/dashboard', { replace: true });
    } catch (_) {}
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name     = t('name_required');
    if (!form.email.trim()) e.email    = t('email_required');
    if (!form.password)     e.password = t('password_required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (_) {
      // authStore.register already shows the error toast
    }
  };

  const onChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const inputStyle = (err) => ({
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${err ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12, padding: '12px 14px',
    fontSize: 14, color: '#f0f7f2',
    outline: 'none', transition: 'border-color 0.15s',
    caretColor: '#12A87D',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080f0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-30%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(18,168,125,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,92,69,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,147,58,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'linear-gradient(135deg, #0A5C45, #12A87D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(18,168,125,0.35)',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: '50%',
              background: '#C9933A', opacity: 0.9,
            }} />
            <svg style={{ position: 'relative', zIndex: 1 }} width="17" height="17" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L7 10L10 13L15 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="3" cy="14" r="1.5" fill="white"/>
              <circle cx="15" cy="6" r="1.5" fill="white"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 24, letterSpacing: '-0.5px', color: '#f0f7f2',
          }}>
            SAV<span style={{ color: '#12A87D' }}>DO</span>
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>

          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 26, color: '#f0f7f2',
            margin: '0 0 6px 0', letterSpacing: '-0.3px',
          }}>
            Hisob yaratish
          </h1>
          <p style={{ color: 'rgba(240,247,242,0.4)', fontSize: 14, margin: '0 0 28px 0' }}>
            1 daqiqada ro'yxatdan o'ting — bepul
          </p>

          {/* Google */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {}}
              width="356"
              shape="rectangular"
              theme="filled_black"
              text="signup_with"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 12, color: 'rgba(240,247,242,0.35)', fontWeight: 500 }}>yoki email bilan</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Ism */}
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(240,247,242,0.4)', marginBottom: 8,
              }}>
                {t('name')}
              </label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={onChange('name')}
                placeholder="Ism va familiyangiz"
                style={inputStyle(errors.name)}
                onFocus={e => e.target.style.borderColor = '#12A87D'}
                onBlur={e => e.target.style.borderColor = errors.name ? '#f87171' : 'rgba(255,255,255,0.1)'}
              />
              {errors.name && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(240,247,242,0.4)', marginBottom: 8,
              }}>
                {t('email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange('email')}
                placeholder={t('enter_email')}
                style={inputStyle(errors.email)}
                onFocus={e => e.target.style.borderColor = '#12A87D'}
                onBlur={e => e.target.style.borderColor = errors.email ? '#f87171' : 'rgba(255,255,255,0.1)'}
              />
              {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Parol */}
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(240,247,242,0.4)', marginBottom: 8,
              }}>
                {t('password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange('password')}
                  placeholder="Parol"
                  style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#12A87D'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#f87171' : 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'rgba(240,247,242,0.35)', display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f0f7f2'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,247,242,0.35)'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '13px',
                background: isLoading
                  ? 'rgba(18,168,125,0.5)'
                  : 'linear-gradient(135deg, #0E7A5C, #12A87D)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                border: 'none', borderRadius: 12, cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(18,168,125,0.3)',
                transition: 'all 0.2s', marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? (
                <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </svg>
              ) : null}
              {isLoading ? 'Yuklanmoqda...' : 'Hisob yaratish →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(240,247,242,0.4)', marginTop: 24 }}>
            Hisobingiz bormi?{' '}
            <Link to="/login" style={{ color: '#12A87D', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#C9933A'}
              onMouseLeave={e => e.target.style.color = '#12A87D'}>
              Kirish
            </Link>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ fontSize: 12, color: 'rgba(240,247,242,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(240,247,242,0.6)'}
            onMouseLeave={e => e.target.style.color = 'rgba(240,247,242,0.3)'}>
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
