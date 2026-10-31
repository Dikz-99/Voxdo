import React from 'react';
import {
  LayoutDashboard,
  Mic,
  CheckSquare,
  Calendar,
  History,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Flame
} from 'lucide-react';
import { User, Subscription } from '../types/index.ts';

export type NavTab =
  | 'dashboard'
  | 'voice-assistant'
  | 'tasks'
  | 'calendar'
  | 'history'
  | 'statistics'
  | 'subscription'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User | null;
  subscription: Subscription | null;
  onOpenVoiceModal: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  subscription,
  onOpenVoiceModal,
  onLogout,
}) => {
  const isPremium = user?.subscription_type === 'PREMIUM';
  const remainingFreeQuota = isPremium ? 999 : Math.max(0, 10 - (user?.daily_voice_count || 0));

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'voice-assistant' as NavTab, label: 'Voice Assistant', icon: Mic, badge: 'AI' },
    { id: 'tasks' as NavTab, label: 'Semua Tugas', icon: CheckSquare },
    { id: 'calendar' as NavTab, label: 'Kalender', icon: Calendar },
    { id: 'history' as NavTab, label: 'Riwayat Suara', icon: History },
    { id: 'statistics' as NavTab, label: 'Statistik & Analisis', icon: BarChart3 },
    { id: 'subscription' as NavTab, label: 'Langganan Premium', icon: Sparkles, highlight: !isPremium },
    { id: 'settings' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] text-slate-100 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#141d2f] border border-slate-700/60 flex items-center justify-center text-rose-400 shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
              VoiceTask <span className="text-rose-400 font-semibold text-xs tracking-wider">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400">Smart Voice Productivity</p>
          </div>
        </div>
      </div>

      {/* Quick Voice Button (Dark Capsule with Rose Mic) */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenVoiceModal}
          className="w-full py-2.5 px-4 bg-[#080d16] hover:bg-[#121927] border border-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group cursor-pointer"
        >
          <Mic className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>Rekam Suara</span>
        </button>
      </div>

      {/* Quota Indicator with Pink/Rose Gradient */}
      <div className="px-4 py-2">
        <div className="p-2.5 rounded-xl bg-[#101726] border border-slate-800/70 text-xs text-slate-300">
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="text-slate-400 font-medium">Quota Suara Hari Ini</span>
            <span className="font-bold text-white">
              {isPremium ? 'Tanpa Batas' : `${user?.daily_voice_count || 0} / 10`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400"
              style={{
                width: isPremium ? '100%' : `${Math.min(100, ((user?.daily_voice_count || 0) / 10) * 100)}%`,
              }}
            />
          </div>
          {!isPremium && remainingFreeQuota <= 3 && (
            <button
              onClick={() => onSelectTab('subscription')}
              className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <Flame className="w-3 h-3" />
              <span>Sisa {remainingFreeQuota} konversi. Upgrade?</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all text-left font-medium ${
                isActive
                  ? 'border border-rose-500/40 bg-rose-950/20 text-rose-300 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-rose-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
              {item.highlight && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0d131f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || 'Sarah Pratama'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar / Ganti Akun"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
