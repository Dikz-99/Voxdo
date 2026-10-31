import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Mic,
  Search,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { User, AppNotification } from '../types/index.ts';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: User | null;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onOpenVoiceModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  user,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  ttsEnabled,
  onToggleTTS,
  onOpenVoiceModal,
  searchQuery,
  onSearchChange,
  onNavigateToTab,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title / Subtitle */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center w-80 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
        <input
          type="text"
          placeholder="Cari tugas, kategori, deadline..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5">
        {/* Primary Bicara Trigger */}
        <button
          onClick={onOpenVoiceModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/90 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-rose-500" />
          <span>Bicara</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 relative transition-colors cursor-pointer"
            title="Notifikasi Pengingat"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifikasi & Pengingat</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Belum ada notifikasi baru.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                        !n.is_read ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-rose-500 opacity-80" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {n.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* TTS Toggle */}
        <button
          onClick={onToggleTTS}
          title={ttsEnabled ? 'Suara AI Aktif (Klik untuk Matikan)' : 'Suara AI Nonaktif (Klik untuk Nyalakan)'}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
            ttsEnabled
              ? 'bg-rose-50 text-rose-600 border-rose-200/90'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-700'
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline text-xs">{ttsEnabled ? 'Suara AI' : 'Suara AI Muted'}</span>
        </button>
      </div>
    </header>
  );
};
