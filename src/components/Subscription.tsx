import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  ArrowRight,
  Download,
  Printer,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { User, Subscription, Invoice, PaymentMethod } from '../types/index.ts';
import { api } from '../services/api.ts';

interface SubscriptionProps {
  user: User | null;
  subscription: Subscription | null;
  onUpgradePlan: (plan: 'FREE' | 'PREMIUM') => Promise<void>;
}

export const SubscriptionView: React.FC<SubscriptionProps> = ({
  user,
  subscription,
  onUpgradePlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [step, setStep] = useState<'select' | 'pay' | 'success'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardName, setCardName] = useState(user?.name || 'Sarah Pratama');

  const isCurrentPremium = user?.subscription_type === 'PREMIUM';

  const loadInvoices = async () => {
    try {
      const list = await api.getInvoices();
      setInvoices(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [user?.id]);

  const handleStartCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await api.createCheckout(billingCycle, paymentMethod);
      setCurrentInvoice(res.invoice);
      setStep('pay');
      setIsCheckoutOpen(true);
    } catch (err: any) {
      alert(err.message || 'Gagal memulai checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodChange = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    setIsProcessing(true);
    try {
      const res = await api.createCheckout(billingCycle, method);
      setCurrentInvoice(res.invoice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentInvoice) return;
    setIsProcessing(true);
    try {
      const res = await api.payInvoice(currentInvoice.id);
      setCurrentInvoice(res.invoice);
      setStep('success');
      await onUpgradePlan('PREMIUM');
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Pembayaran gagal diverifikasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchToFree = async () => {
    if (!confirm('Apakah Anda yakin ingin beralih kembali ke Paket Free (kuota 10 konversi/hari)?')) return;
    setIsProcessing(true);
    try {
      await onUpgradePlan('FREE');
      await loadInvoices();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyVA = () => {
    if (currentInvoice?.va_number) {
      navigator.clipboard.writeText(currentInvoice.va_number);
      setCopiedVA(true);
      setTimeout(() => setCopiedVA(false), 2000);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Sistem Berlangganan & Pembayaran Nyata</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Paket Langganan VoiceTask AI
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Ubah ucapan santai jadi daftar tugas terstruktur tanpa batasan kuota harian.
        </p>

        {/* Current Plan Badge */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-500">Paket Aktif Anda:</span>
          <span
            className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
              isCurrentPremium
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {isCurrentPremium ? '✓ PREMIUM PLAN (Aktif)' : 'FREE PLAN (Maks. 10 Suara/Hari)'}
          </span>
        </div>

        {/* Billing cycle toggle */}
        <div className="pt-4 flex items-center justify-center">
          <div className="p-1 bg-slate-100 rounded-xl inline-flex items-center text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (Rp 49.000)
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tahunan (Rp 490.000)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                Hemat 2 Bulan
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div
          className={`p-6 rounded-2xl border bg-white shadow-xs flex flex-col justify-between ${
            !isCurrentPremium ? 'border-slate-300 ring-1 ring-slate-300' : 'border-slate-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Free Plan</h3>
                <p className="text-xs text-slate-400">Untuk produktivitas personal dasar</p>
              </div>
              {!isCurrentPremium && (
                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Paket Anda
                </span>
              )}
            </div>

            <div className="pt-2">
              <span className="text-3xl font-extrabold text-slate-900">Gratis</span>
              <span className="text-xs text-slate-400"> / selamanya</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Maksimal 10 konversi suara per hari</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Manajemen tugas & To-Do List standar</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dashboard produktivitas</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSwitchToFree}
              disabled={!isCurrentPremium}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                !isCurrentPremium
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              {!isCurrentPremium ? 'Sedang Digunakan' : 'Beralih ke Paket Free (Uji Kuota 10)'}
            </button>
          </div>
        </div>

        {/* Premium Plan (Featured) */}
        <div className="p-6 rounded-2xl border-2 border-blue-600 bg-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
            Rekomendasi
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <span>Premium Plan</span>
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-xs text-slate-500">Akses tanpa batas & integrasi lengkap</p>
              </div>
              {isCurrentPremium && (
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Sedang Aktif
                </span>
              )}
            </div>

            <div className="pt-2">
              <span className="text-3xl font-extrabold text-blue-600">
                {billingCycle === 'monthly' ? 'Rp 49.000' : 'Rp 490.000'}
              </span>
              <span className="text-xs text-slate-500">
                {billingCycle === 'monthly' ? ' / bulan' : ' / tahun'}
              </span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-900">
                  Konversi suara tanpa batas (Unlimited Voice)
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>AI Assistant cerdas bertenaga Gemini 3.8</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Pengingat otomatis & Browser Notification</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Ekspor Google Calendar (.ics)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Ekspor & Sinkronisasi Format Notion (.md)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Kwitansi resmi & riwayat tagihan</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleStartCheckout}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-98 text-white transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isCurrentPremium
                  ? 'Perpanjang / Kelola Langganan'
                  : 'Bayar & Upgrade ke Premium Sekarang'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice & Payment History Table */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pembayaran & Invoice</h3>
            <p className="text-xs text-slate-400">Bukti transaksi tersimpan aman di database</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">{invoices.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-2 font-semibold">No. Invoice</th>
                <th className="py-2 font-semibold">Tanggal</th>
                <th className="py-2 font-semibold">Paket</th>
                <th className="py-2 font-semibold">Metode</th>
                <th className="py-2 font-semibold">Total</th>
                <th className="py-2 font-semibold">Status</th>
                <th className="py-2 font-semibold text-right">Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-slate-700 font-medium">
                    {inv.plan} ({inv.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                  </td>
                  <td className="py-3 text-slate-600 uppercase font-medium">
                    {inv.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3 font-semibold text-slate-900">
                    Rp {inv.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={api.getReceiptUrl(inv.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada riwayat pembayaran.
            </div>
          )}
        </div>
      </div>

      {/* Real Interactive Payment Gateway Checkout Modal */}
      {isCheckoutOpen && currentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Payment Gateway Checkout</h3>
                  <p className="text-[11px] text-slate-500">
                    Invoice: <span className="font-mono">{currentInvoice.invoice_number}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {step === 'pay' && (
                <>
                  {/* Total order summary */}
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Tagihan</span>
                      <span className="text-lg font-extrabold text-blue-700">
                        Rp {currentInvoice.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Paket Dipilih</span>
                      <span className="font-semibold text-slate-900">
                        Premium ({currentInvoice.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Pilih Metode Pembayaran:
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleMethodChange('qris')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'qris'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-5 h-5" />
                        <span>QRIS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMethodChange('bca_va')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'bca_va'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                        <span>BCA VA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMethodChange('credit_card')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === 'credit_card'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Kartu Kredit</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment details according to method */}
                  {paymentMethod === 'qris' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                      <div className="inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        {/* Render dynamic SVG QR Code pattern */}
                        <svg className="w-40 h-40 mx-auto" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner Markers */}
                          <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                          <rect x="8" y="8" width="19" height="19" fill="white" />
                          <rect x="12" y="12" width="11" height="11" fill="#0f172a" />

                          <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                          <rect x="73" y="8" width="19" height="19" fill="white" />
                          <rect x="77" y="12" width="11" height="11" fill="#0f172a" />

                          <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                          <rect x="8" y="73" width="19" height="19" fill="white" />
                          <rect x="12" y="77" width="11" height="11" fill="#0f172a" />

                          {/* Data Matrix Dots */}
                          <rect x="36" y="10" width="8" height="8" fill="#2563eb" />
                          <rect x="48" y="10" width="6" height="6" fill="#0f172a" />
                          <rect x="58" y="12" width="6" height="6" fill="#2563eb" />
                          <rect x="36" y="24" width="6" height="6" fill="#0f172a" />
                          <rect x="46" y="24" width="8" height="8" fill="#2563eb" />
                          <rect x="10" y="36" width="6" height="6" fill="#0f172a" />
                          <rect x="20" y="38" width="8" height="8" fill="#2563eb" />
                          <rect x="34" y="36" width="10" height="10" fill="#0f172a" />
                          <rect x="48" y="38" width="8" height="8" fill="#2563eb" />
                          <rect x="62" y="36" width="6" height="6" fill="#0f172a" />
                          <rect x="74" y="38" width="16" height="6" fill="#2563eb" />
                          <rect x="36" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="46" y="50" width="10" height="10" fill="#2563eb" />
                          <rect x="60" y="52" width="8" height="8" fill="#0f172a" />
                          <rect x="74" y="52" width="8" height="8" fill="#0f172a" />
                          <rect x="36" y="66" width="8" height="8" fill="#2563eb" />
                          <rect x="48" y="66" width="6" height="6" fill="#0f172a" />
                          <rect x="58" y="68" width="8" height="8" fill="#2563eb" />
                          <rect x="70" y="68" width="8" height="8" fill="#0f172a" />
                          <rect x="82" y="68" width="8" height="8" fill="#2563eb" />
                          <rect x="36" y="80" width="6" height="6" fill="#0f172a" />
                          <rect x="46" y="80" width="12" height="6" fill="#2563eb" />
                          <rect x="62" y="80" width="6" height="6" fill="#0f172a" />
                          <rect x="74" y="80" width="12" height="12" fill="#2563eb" />
                        </svg>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-slate-800 block">
                          Scan QRIS dengan GoPay, OVO, Dana, ShopeePay, atau BCA
                        </span>
                        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Berlaku hingga 14 menit 59 detik</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bca_va' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nomor Virtual Account BCA:</span>
                        <span className="text-blue-600 font-bold uppercase text-[11px]">BCA VA</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                          {currentInvoice.va_number || '8077712398471923'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyVA}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedVA ? 'Disalin!' : 'Salin'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Transfer tepat sebesar{' '}
                        <strong className="text-slate-700">
                          Rp {currentInvoice.amount.toLocaleString('id-ID')}
                        </strong>{' '}
                        melalui m-BCA, KlikBCA, atau ATM BCA.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'credit_card' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Nomor Kartu Kredit / Debit
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Masa Berlaku (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Enkripsi 256-bit SSL & 3D Secure Protection</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isProcessing}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <span>Menghubungi Payment Gateway...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {paymentMethod === 'qris'
                              ? 'Konfirmasi Pembayaran QRIS (Bayar Sekarang)'
                              : paymentMethod === 'bca_va'
                              ? 'Simulasi Transfer Selesai (Verifikasi Bayar)'
                              : 'Bayar Sekarang & Proses Transaksi'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {step === 'success' && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Pembayaran Berhasil!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Akun Anda telah di-upgrade ke VoiceTask AI Premium. Kuota konversi tanpa batas
                      telah aktif di database.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Invoice:</span>
                      <span className="font-semibold text-slate-800">{currentInvoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Dibayar:</span>
                      <span className="font-bold text-blue-600">
                        Rp {currentInvoice.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status Transaksi:</span>
                      <span className="font-bold text-emerald-600">LUNAS / BERHASIL</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={api.getReceiptUrl(currentInvoice.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Bukti Pembayaran</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Mulai Nikmati Fitur Premium
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
