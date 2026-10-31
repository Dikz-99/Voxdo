/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { TaskList } from './components/TaskList.tsx';
import { VoiceAssistant } from './components/VoiceAssistant.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { VoiceHistory } from './components/VoiceHistory.tsx';
import { Statistics } from './components/Statistics.tsx';
import { SubscriptionView } from './components/Subscription.tsx';
import { SettingsView } from './components/Settings.tsx';
import { VoiceModal } from './components/VoiceModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { useSpeech } from './hooks/useSpeech.ts';
import { api, getStoredUser, setStoredUser } from './services/api.ts';
import { User, Task, VoiceHistoryItem, Subscription, AppNotification, TaskStatus } from './types/index.ts';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Speech Recognition & TTS hook
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    setTranscript,
    interimTranscript,
    audioLevel,
    speechError,
    speak,
    stopSpeaking,
    isSpeaking,
    settings: speechSettings,
    updateSettings: updateSpeechSettings,
  } = useSpeech();

  // Load user profile & initial data
  const loadUserData = useCallback(async () => {
    try {
      const authData = await api.getMe();
      setUser(authData.user);
      setSubscription(authData.subscription);
    } catch {
      // Default to demo user Sarah if not authenticated
      try {
        const authData = await api.login('sarah@voicetask.ai', 'password123');
        setUser(authData.user);
        setSubscription(authData.subscription);
      } catch (e) {
        console.error('Failed to init demo user:', e);
      }
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const taskList = await api.getTasks();
      setTasks(taskList);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  }, []);

  const refreshVoiceHistory = useCallback(async () => {
    try {
      const historyList = await api.getVoiceHistory();
      setVoiceHistory(historyList);
    } catch (e) {
      console.error('Failed to load voice history:', e);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (user?.id) {
      refreshTasks();
      refreshVoiceHistory();
      refreshNotifications();
    }
  }, [user?.id, refreshTasks, refreshVoiceHistory, refreshNotifications]);

  // Task actions
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus: TaskStatus = currentStatus === 'Selesai' ? 'Belum Dimulai' : 'Selesai';
    try {
      await api.updateTask(taskId, { status: nextStatus });
      await refreshTasks();
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      await refreshTasks();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await api.updateTask(taskData.id, taskData);
    } else {
      await api.createTask(taskData);
    }
    await refreshTasks();
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await api.deleteVoiceHistory(id);
      await refreshVoiceHistory();
    } catch (e) {
      console.error('Failed to delete history:', e);
    }
  };

  const handleReProcessVoice = (oldTranscript: string) => {
    setTranscript(oldTranscript);
    setIsVoiceModalOpen(true);
  };

  const handleUpgradePlan = async (targetPlan: 'FREE' | 'PREMIUM') => {
    const res = await api.upgradeSubscription(targetPlan);
    setUser(res.user);
    setSubscription(res.subscription);
    await refreshNotifications();
  };

  const handleSwitchUser = async (email: string) => {
    try {
      const res = await api.login(email, 'password123');
      setUser(res.user);
      setSubscription(res.subscription);
      await refreshTasks();
      await refreshVoiceHistory();
      await refreshNotifications();
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  const handleLogout = () => {
    setStoredUser(null);
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (u: User, s: Subscription) => {
    setUser(u);
    setSubscription(s);
    refreshTasks();
    refreshVoiceHistory();
    refreshNotifications();
  };

  const handleNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    refreshNotifications();
  };

  // Titles mapping
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Ringkasan', subtitle: 'Pusat produktivitas dan tugas harian' },
    'voice-assistant': { title: 'Voice Assistant AI', subtitle: 'Percakapan cerdas & perintah suara' },
    tasks: { title: 'Semua Tugas', subtitle: 'Kelola, filter, dan selesaikan pekerjaan' },
    calendar: { title: 'Kalender & Jadwal', subtitle: 'Tampilan tanggal dan ekspor jadwal' },
    history: { title: 'Riwayat Suara', subtitle: 'Arsip audio dan ekstraksi tugas' },
    statistics: { title: 'Statistik & Analisis', subtitle: 'Metrik efisiensi dan adopsi suara' },
    subscription: { title: 'Langganan Premium', subtitle: 'Perbandingan paket dan status lisensi' },
    settings: { title: 'Pengaturan', subtitle: 'Kustomisasi suara AI dan notifikasi' },
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          user={user}
          subscription={subscription}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-slate-900 h-full flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-white font-bold text-sm">VoiceTask AI</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }}
              user={user}
              subscription={subscription}
              onOpenVoiceModal={() => {
                setIsVoiceModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-3 text-slate-600 hover:text-slate-900 border-r border-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header
              title={titles[currentTab].title}
              subtitle={titles[currentTab].subtitle}
              user={user}
              notifications={notifications}
              onMarkNotificationRead={handleNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              ttsEnabled={speechSettings.ttsEnabled}
              onToggleTTS={() =>
                updateSpeechSettings({ ttsEnabled: !speechSettings.ttsEnabled })
              }
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNavigateToTab={setCurrentTab}
            />
          </div>
        </div>

        {/* Viewport Router Content */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              user={user}
              tasks={tasks}
              voiceHistory={voiceHistory}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onNavigateToTab={setCurrentTab}
              onToggleTaskStatus={handleToggleTaskStatus}
              onOpenNewTaskModal={() => {
                setCurrentTab('tasks');
              }}
            />
          )}

          {currentTab === 'tasks' && (
            <TaskList
              tasks={tasks}
              onToggleStatus={handleToggleTaskStatus}
              onDeleteTask={handleDeleteTask}
              onSaveTask={handleSaveTask}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              searchQuery={searchQuery}
              isPremium={user?.subscription_type === 'PREMIUM'}
              onUpgradePrompt={() => setCurrentTab('subscription')}
            />
          )}

          {currentTab === 'voice-assistant' && (
            <VoiceAssistant
              tasks={tasks}
              onTasksUpdated={refreshTasks}
              isListening={isListening}
              startListening={startListening}
              stopListening={stopListening}
              transcript={transcript}
              interimTranscript={interimTranscript}
              audioLevel={audioLevel}
              speechError={speechError}
              speak={speak}
              stopSpeaking={stopSpeaking}
              isSpeaking={isSpeaking}
              ttsEnabled={speechSettings.ttsEnabled}
              onToggleTTS={() =>
                updateSpeechSettings({ ttsEnabled: !speechSettings.ttsEnabled })
              }
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}

          {currentTab === 'history' && (
            <VoiceHistory
              history={voiceHistory}
              onDeleteHistory={handleDeleteHistory}
              onReProcess={handleReProcessVoice}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}

          {currentTab === 'statistics' && (
            <Statistics tasks={tasks} voiceHistory={voiceHistory} />
          )}

          {currentTab === 'subscription' && (
            <SubscriptionView
              user={user}
              subscription={subscription}
              onUpgradePlan={handleUpgradePlan}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              subscription={subscription}
              speechSettings={speechSettings}
              onUpdateSpeechSettings={updateSpeechSettings}
              speak={speak}
              onUserUpdated={(updatedUser) => setUser(updatedUser)}
              onSwitchUser={handleSwitchUser}
            />
          )}
        </main>
      </div>

      {/* Voice-To-Task Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTasksSaved={async () => {
          await refreshTasks();
          await refreshVoiceHistory();
          await refreshNotifications();
          loadUserData();
        }}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        transcript={transcript}
        setTranscript={setTranscript}
        interimTranscript={interimTranscript}
        audioLevel={audioLevel}
        speechError={speechError}
        speak={speak}
        isSpeaking={isSpeaking}
        stopSpeaking={stopSpeaking}
        onUpgradePrompt={() => {
          setIsVoiceModalOpen(false);
          setCurrentTab('subscription');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
