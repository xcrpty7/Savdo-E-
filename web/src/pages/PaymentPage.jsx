import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a1f12] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] dark:text-[rgba(224,242,236,0.6)] mb-4">To'lov ma'lumoti topilmadi</p>
          <button onClick={() => navigate('/pricing')} className="text-green-600 font-semibold hover:underline">
            Tariflarga qaytish
          </button>
        </div>
      </div>
    );
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Nusxalandi');
    });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a1f12]">
      <div className="bg-white dark:bg-[#112920] border-b border-[#E2E8F0] dark:border-white/[0.07] px-5 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate('/pricing')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#e0f2ec]">To'lov</h1>
      </div>

      <div className="px-4 py-8 max-w-md mx-auto">
        <div className="bg-white dark:bg-[#112920] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.07] p-6">
          <div className="text-center mb-6">
            <p className="text-[#64748B] dark:text-[rgba(224,242,236,0.6)] text-sm mb-1">To'lov summasi</p>
            <p className="text-3xl font-extrabold text-[#0F172A] dark:text-[#e0f2ec]">{data.amountUzs} so'm</p>
          </div>

          <div className="bg-[#F1F5F9] dark:bg-white/[0.04] rounded-xl p-4 mb-6">
            <p className="text-xs text-[#64748B] dark:text-[rgba(224,242,236,0.6)] mb-2">To'lov ma'lumotlari</p>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B] dark:text-[rgba(224,242,236,0.6)]">Buyurtma ID</span>
              <span className="font-mono text-xs text-[#0F172A] dark:text-[#e0f2ec]">{data.orderId}</span>
            </div>
          </div>

          <a
            href={data.paymeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 mb-3"
          >
            <ExternalLink size={18} />
            Payme orqali to'lash
          </a>

          <button
            onClick={() => copyToClipboard(data.paymeUrl)}
            className="w-full h-12 rounded-xl border border-[#E2E8F0] dark:border-white/[0.07] text-sm text-[#64748B] dark:text-[rgba(224,242,236,0.6)] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
          >
            Havolani nusxalash
          </button>
        </div>
      </div>
    </div>
  );
}
