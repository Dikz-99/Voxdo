import React, { useState } from 'react';
import { Mic, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api.ts';
import { User, Subscription } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, subscription: Subscription) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        const res = await api.register(name, email, password);
        onAuthSuccess(res.user, res.subscription);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user, res.subscription);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat otentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.login(demoEmail, 'password123');
      onAuthSuccess(res.user, res.subscription);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Brand Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold">
            {isRegister ? 'Daftar Akun VoiceTask AI' : 'Masuk ke VoiceTask AI'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola ide & produktivitasmu hanya dengan berbicara
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarah Pratama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:bg-slate-300 transition-colors"
          >
            {isLoading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk ke Akun'}
          </button>

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block mb-2 text-center">
              Atau coba langsung dengan Akun Demo:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('sarah@voicetask.ai')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 text-center transition-colors"
              >
                Demo Sarah (Premium)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('budi@gmail.com')}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 text-center transition-colors"
              >
                Demo Budi (Free)
              </button>
            </div>
          </div>

          {/* Switch Register/Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isRegister
                ? 'Sudah punya akun? Masuk di sini'
                : 'Belum punya akun? Daftar gratis sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
