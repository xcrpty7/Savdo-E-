import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, LogIn, BarChart2, Package, TrendingUp,
  ShieldCheck, Star, Users, CheckCircle, ShoppingBag, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

const LANGS = ['uz', 'ru', 'en'];

const TX = {
  uz: {
    tagline:     "Kichik biznes uchun savdo menejeri",
    headline:    "Savdoni boshqarish hech qachon bu qadar oson bo'lmagan",
    sub:         "Kunlik savdolar, foyda tahlili, omborxona — barchasi bir joyda va bepul",
    login_title: "Tizimga kirish",
    login_sub:   "Hisobingizga kiring",
    no_account:  "Hisob yo'qmi?",
    register:    "Ro'yxatdan o'ting",
    features: [
      { icon: BarChart2,   title: "Hisobotlar",     desc: "Kunlik va oylik savdo statistikasi bir qarashda" },
      { icon: Package,     title: "Omborxona",       desc: "Mahsulot zaxiralarini real vaqtda kuzating" },
      { icon: TrendingUp,  title: "Foyda tahlili",   desc: "Har bir mahsulotdan qancha foyda olayotganingizni biling" },
      { icon: ShieldCheck, title: "Xavfsizlik",      desc: "Ma'lumotlaringiz JWT va shifrlash bilan himoyalangan" },
    ],
    stats: [
      { value: "3",       label: "Til qo'llab-quvvatlanadi",  sub: "UZ · RU · EN" },
      { value: "100%",    label: "Xavfsiz",                   sub: "JWT himoya" },
      { value: "24/7",    label: "Ishlaydi",                  sub: "Har doim mavjud" },
      { value: "∞",       label: "Mahsulotlar",               sub: "Cheksiz qo'shish" },
    ],
    testimonial: {
      text: "SAVDO menga har kuni qancha foyda qilayotganimni ko'rsatadi. Endi daftarga yozmayman.",
      name: "Abdulloh T.",
      role: "Do'kon egasi, Toshkent",
    },
    trust: ["Ma'lumotlaringiz xavfsiz", "Bepul foydalanish", "O'rnatish shart emas"],
    how_title: "Qanday ishlaydi?",
    steps: [
      { n: "1", title: "Ro'yxatdan o'ting",     desc: "1 daqiqada hisob yarating" },
      { n: "2", title: "Mahsulot qo'shing",      desc: "Mahsulotlar va narxlarni kiriting" },
      { n: "3", title: "Savdo qiling",            desc: "Har bir savdoni qayd eting" },
      { n: "4", title: "Hisobot ko'ring",         desc: "Foyda va statistikani tahlil qiling" },
    ],
  },
  ru: {
    tagline:     "Менеджер продаж для малого бизнеса",
    headline:    "Управление продажами никогда не было таким простым",
    sub:         "Ежедневные продажи, анализ прибыли, склад — всё в одном месте и бесплатно",
    login_title: "Войти в систему",
    login_sub:   "Войдите в ваш аккаунт",
    no_account:  "Нет аккаунта?",
    register:    "Зарегистрироваться",
    features: [
      { icon: BarChart2,   title: "Отчёты",         desc: "Ежедневная и месячная статистика продаж с одного взгляда" },
      { icon: Package,     title: "Склад",           desc: "Отслеживайте запасы товаров в режиме реального времени" },
      { icon: TrendingUp,  title: "Анализ прибыли",  desc: "Узнайте, сколько вы зарабатываете на каждом товаре" },
      { icon: ShieldCheck, title: "Безопасность",    desc: "Данные защищены с помощью JWT и шифрования" },
    ],
    stats: [
      { value: "3",       label: "Языка поддерживается",  sub: "UZ · RU · EN" },
      { value: "100%",    label: "Безопасно",              sub: "JWT защита" },
      { value: "24/7",    label: "Работает",               sub: "Всегда доступно" },
      { value: "∞",       label: "Товаров",                sub: "Добавляйте без лимита" },
    ],
    testimonial: {
      text: "SAVDO показывает мне каждый день, сколько я зарабатываю. Больше не веду тетрадь.",
      name: "Абдулло Т.",
      role: "Владелец магазина, Ташкент",
    },
    trust: ["Ваши данные в безопасности", "Бесплатное использование", "Установка не нужна"],
    how_title: "Как это работает?",
    steps: [
      { n: "1", title: "Зарегистрируйтесь",   desc: "Создайте аккаунт за 1 минуту" },
      { n: "2", title: "Добавьте товары",      desc: "Введите товары и цены" },
      { n: "3", title: "Ведите продажи",       desc: "Записывайте каждую продажу" },
      { n: "4", title: "Смотрите отчёты",      desc: "Анализируйте прибыль и статистику" },
    ],
  },
  en: {
    tagline:     "Sales manager for small businesses",
    headline:    "Managing sales has never been this easy",
    sub:         "Daily sales, profit analysis, warehouse — all in one place, completely free",
    login_title: "Sign In",
    login_sub:   "Sign into your account",
    no_account:  "Don't have an account?",
    register:    "Sign Up",
    features: [
      { icon: BarChart2,   title: "Reports",         desc: "Daily and monthly sales statistics at a glance" },
      { icon: Package,     title: "Warehouse",        desc: "Track product inventory in real time" },
      { icon: TrendingUp,  title: "Profit Analysis",  desc: "Know exactly how much you earn on each product" },
      { icon: ShieldCheck, title: "Security",         desc: "Your data is protected with JWT and encryption" },
    ],
    stats: [
      { value: "3",       label: "Languages supported",  sub: "UZ · RU · EN" },
      { value: "100%",    label: "Secure",               sub: "JWT protection" },
      { value: "24/7",    label: "Available",            sub: "Always online" },
      { value: "∞",       label: "Products",             sub: "Add without limits" },
    ],
    testimonial: {
      text: "SAVDO shows me every day how much I'm earning. I don't use notebooks anymore.",
      name: "Abdulloh T.",
      role: "Store owner, Tashkent",
    },
    trust: ["Your data is secure", "Free to use", "No installation needed"],
    how_title: "How does it work?",
    steps: [
      { n: "1", title: "Register",         desc: "Create an account in 1 minute" },
      { n: "2", title: "Add products",     desc: "Enter products and prices" },
      { n: "3", title: "Record sales",     desc: "Log every sale you make" },
      { n: "4", title: "View reports",     desc: "Analyze profit and statistics" },
    ],
  },
};

export default function Login() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('ru') ? 'ru' : i18n.language.startsWith('en') ? 'en' : 'uz';
  const tx = TX[lang];

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const user = await googleLogin(credential);
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (_) {}
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = t('email_required');
    if (!form.password)     e.password = t('password_required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      // ADMIN/SUPER_ADMIN — authStore o'zi admin panelga SSO orqali yo'naltiradi
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (_) {}
  };

  const onChange = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: '' }));
  };

  const cls = (f) =>
    `w-full h-12 rounded-xl border px-4 text-sm text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 ${
      errors[f] ? 'border-red-400 bg-red-50' : 'border-[#E2E8F0]'
    }`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">SAVDO</span>
          <span className="hidden sm:block text-xs text-[#94A3B8] font-medium ml-1 border border-[#E2E8F0] px-2 py-0.5 rounded-md">{tx.tagline.split(' ').slice(0, 3).join(' ')}…</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe size={15} className="text-[#94A3B8]" />
          <div className="flex gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  i18n.language.startsWith(l)
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero + Form ─────────────────────────────────── */}
      <section className="px-4 pt-14 pb-16 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          {tx.tagline}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] max-w-xl leading-tight mb-4">
          {tx.headline}
        </h1>
        <p className="text-[#64748B] text-base max-w-md leading-relaxed mb-10">{tx.sub}</p>

        {/* Login card */}
        <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E2E8F0] shadow-lg shadow-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-extrabold text-[#0F172A]">{tx.login_title}</h2>
            <p className="text-[#64748B] text-sm mt-0.5">{tx.login_sub}</p>
          </div>

          {/* Google login */}
          <div className="px-6 pt-4 pb-2 flex flex-col gap-3">
            <div className="flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {}}
                width="352"
                shape="rectangular"
                theme="outline"
                text="signin_with"
                locale="uz"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-xs text-[#94A3B8] font-medium">yoki</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-6 pb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">{t('email')}</label>
              <input type="email" autoComplete="email" value={form.email} onChange={onChange('email')} placeholder={t('enter_email')} className={cls('email')} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange('password')}
                  placeholder="••••••••"
                  className={`w-full h-12 rounded-xl border px-4 pr-12 text-sm text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 ${errors.password ? 'border-red-400 bg-red-50' : 'border-[#E2E8F0]'}`}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] p-1.5 rounded-lg transition">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 hover:underline">
                  {t('forgot_password') || 'Parolni unutdingizmi?'}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-green-500/30 mt-1"
            >
              {isLoading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={16} />{t('login')}</>
              }
            </button>
          </form>

          {/* Trust */}
          <div className="px-6 pb-5 border-t border-[#F1F5F9] pt-4 flex flex-col gap-2">
            {tx.trust.map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#64748B] mt-5 text-sm">
          {tx.no_account}{' '}
          <Link to="/register" className="text-green-600 font-bold hover:text-green-700 transition">{tx.register}</Link>
        </p>
      </section>

      {/* ── Stats row ───────────────────────────────────── */}
      <section className="px-4 pb-14">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tx.stats.map((s, i) => (
            <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-[#0F172A]">{s.value}</p>
              <p className="text-sm font-semibold text-[#0F172A] mt-1">{s.label}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────── */}
      <section className="px-4 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tx.features.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] text-base">{title}</p>
                  <p className="text-[#64748B] text-sm mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="px-4 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-[#0F172A] text-center mb-6">{tx.how_title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tx.steps.map((step, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 text-center shadow-sm relative">
                <div className="w-10 h-10 bg-green-500 text-white text-lg font-extrabold rounded-full flex items-center justify-center mx-auto mb-3">
                  {step.n}
                </div>
                <p className="font-bold text-[#0F172A] text-sm">{step.title}</p>
                <p className="text-[#94A3B8] text-xs mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-xl mx-auto bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-8 text-center shadow-lg shadow-green-500/20">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(n => <Star key={n} size={16} className="text-yellow-300 fill-yellow-300" />)}
          </div>
          <p className="text-white text-base leading-relaxed italic mb-6">"{tx.testimonial.text}"</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">{tx.testimonial.name}</p>
              <p className="text-green-100 text-xs">{tx.testimonial.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-[#E2E8F0] bg-white px-6 py-5 text-center">
        <span className="text-sm font-extrabold text-green-500 tracking-tight">SAVDO</span>
        <p className="text-xs text-[#94A3B8] mt-1">© 2024 · {tx.tagline}</p>
      </footer>
    </div>
  );
}
