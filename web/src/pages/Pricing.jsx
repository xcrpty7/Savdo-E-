import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as subscriptionApi from '../api/subscription.api';

const plans = [
  {
    id: 'pro',
    name: 'PRO',
    price: 24900,
    icon: Zap,
    color: '#7C3AED',
    features: ['250 ta tovar', 'Narx tarixi', 'Excel eksport', 'Kunlik hisobot', 'Oflayn rejim'],
  },
  {
    id: 'biznes',
    name: 'BIZNES',
    price: 49900,
    icon: Building2,
    color: '#D97706',
    features: ['Cheksiz tovar', 'API kirish', 'Audit jurnali', "Ko'p foydalanuvchi", 'Barcha PRO imkoniyatlari'],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState('');
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    subscriptionApi.getMySubscription().then((res) => {
      setCurrentPlan(res.data?.data?.subscription?.plan || 'free');
    }).catch(() => {});
  }, []);

  async function handlePay(planId) {
    setLoading(planId);
    try {
      const res = await subscriptionApi.createPayment({ plan: planId });
      const data = res.data.data;
      navigate('/payment', { state: data });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading('');
    }
  }

  async function handleDemo(planId) {
    setLoading(planId);
    try {
      await subscriptionApi.demoPayment({ plan: planId });
      toast.success(`${planId === 'pro' ? 'PRO' : 'BIZNES'} aktivlashtirildi (demo)`);
      setCurrentPlan(planId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a1f12]">
      <div className="bg-white dark:bg-[#112920] border-b border-[#E2E8F0] dark:border-white/[0.07] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#e0f2ec]">Tarif rejasi</h1>
      </div>

      <div className="px-4 py-8 max-w-lg mx-auto">
        <p className="text-sm text-[#64748B] dark:text-[rgba(224,242,236,0.6)] mb-6 text-center">
          Joriy tarif: <span className="font-bold text-[#0F172A] dark:text-[#e0f2ec] uppercase">{currentPlan}</span>
        </p>

        <div className="flex flex-col gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-[#112920] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.07] p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: plan.color + '20' }}
                  >
                    <Icon size={20} style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A] dark:text-[#e0f2ec]">{plan.name}</p>
                    <p className="text-sm text-[#64748B] dark:text-[rgba(224,242,236,0.6)]">
                      {plan.price.toLocaleString()} so'm / oy
                    </p>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#475569] dark:text-[rgba(224,242,236,0.7)]">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePay(plan.id)}
                    disabled={isActive || loading === plan.id}
                    className="flex-1 h-11 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold text-sm transition"
                  >
                    {loading === plan.id ? '...' : isActive ? 'Aktiv' : "To'lash"}
                  </button>
                  {!isActive && (
                    <button
                      onClick={() => handleDemo(plan.id)}
                      disabled={loading === plan.id}
                      className="h-11 px-4 rounded-xl border border-[#E2E8F0] dark:border-white/[0.07] text-xs text-[#64748B] dark:text-[rgba(224,242,236,0.6)] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                    >
                      Demo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
