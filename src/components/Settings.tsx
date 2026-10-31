import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  Bell,
  User as UserIcon,
  Check,
  Shield,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';
import { User, Subscription } from '../types/index.ts';
import { SpeechSettings } from '../hooks/useSpeech.ts';
import { api } from '../services/api.ts';

interface SettingsProps {
  user: User | null;
  subscription: Subscription | null;
  speechSettings: SpeechSettings;
  onUpdateSpeechSettings: (newSettings: Partial<SpeechSettings>) => void;
  speak: (text: string) => void;
  onUserUpdated: (user: User) => void;
  onSwitchUser: (email: string) => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  user,
  subscription,
  speechSettings,
  onUpdateSpeechSettings,
  speak,
  onUserUpdated,
  onSwitchUser,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api.updateProfile({ name, avatar });
      onUserUpdated(res.user);
      setProfileMsg('Profil berhasil diperbarui.');
      setTimeout(() => setProfileMsg(null), 2500);
    } catch (e: any) {
      setProfileMsg('Gagal memperbarui profil: ' + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser Anda tidak mendukung push notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification('VoiceTask AI', {
        body: 'Notifikasi pengingat tugas berhasil diaktifkan!',
      });
    }
  };

  const handleTestVoice = () => {
    speak('Halo! Ini adalah contoh suara asisten VoiceTask AI dalam Bahasa Indonesia.');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Aplikasi</h1>
        <p className="text-xs text-slate-500">
          Konfigurasi suara AI, notifikasi pengingat, dan profil akun
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: AI Voice Feedback Settings */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pengaturan Suara AI (Text-to-Speech)</h2>
              <p className="text-xs text-slate-400">Atur cara asisten berbicara kepada Anda</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Enable TTS */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Respon Suara Otomatis</span>
                <span className="text-slate-400">AI membacakan hasil tugas dan jawaban asisten lisan</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSpeechSettings({ ttsEnabled: !speechSettings.ttsEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  speechSettings.ttsEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    speechSettings.ttsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Voice Speed Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Kecepatan Bicara (Speed)</span>
                <span className="font-bold text-blue-600">{speechSettings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={speechSettings.rate}
                onChange={(e) => onUpdateSpeechSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Lambat (0.7x)</span>
                <span>Normal (1.0x)</span>
                <span>Cepat (1.5x)</span>
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestVoice}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Tes Suara Asisten</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Browser Notification Settings */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notifikasi Pengingat Tugas</h2>
              <p className="text-xs text-slate-400">Pengingat deadline otomatis di browser</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Status Izin Notifikasi Browser</span>
              <span className="text-slate-400">
                Status saat ini: <strong className="capitalize">{notifPermission}</strong>
              </span>
            </div>

            <button
              onClick={handleRequestNotification}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              {notifPermission === 'granted' ? 'Uji Notifikasi' : 'Aktifkan Izin Notifikasi'}
            </button>
          </div>
        </div>

        {/* Section 3: Profile Settings */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <UserIcon className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Profil Pengguna</h2>
              <p className="text-xs text-slate-400">Kelola identitas dan akun Anda</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {profileMsg && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg font-medium">
                {profileMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Terdaftar)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs disabled:bg-slate-300"
            >
              {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* Section 4: Quick Demo Account Switcher */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
          <span className="font-bold text-slate-800 block">Ganti Akun Demo Pengujian:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSwitchUser('sarah@voicetask.ai')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                user?.email === 'sarah@voicetask.ai'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Sarah Pratama (Premium)
            </button>
            <button
              onClick={() => onSwitchUser('budi@gmail.com')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                user?.email === 'budi@gmail.com'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Budi Santoso (Free)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
