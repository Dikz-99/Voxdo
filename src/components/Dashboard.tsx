import React from 'react';
import {
  Mic,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
  Flame,
  Calendar as CalendarIcon
} from 'lucide-react';
import { User, Task, VoiceHistoryItem } from '../types/index.ts';

interface DashboardProps {
  user: User | null;
  tasks: Task[];
  voiceHistory: VoiceHistoryItem[];
  onOpenVoiceModal: () => void;
  onNavigateToTab: (tab: any) => void;
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void;
  onOpenNewTaskModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  tasks,
  voiceHistory,
  onOpenVoiceModal,
  onNavigateToTab,
  onToggleTaskStatus,
  onOpenNewTaskModal,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Selesai').length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(t => t.priority === 'Tinggi' && t.status !== 'Selesai');

  // Approaching deadline (tasks within next 3 days)
  const now = new Date('2026-10-31T11:38:00');
  const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
  const nearDeadlineTasks = tasks.filter(t => {
    if (!t.deadline || t.status === 'Selesai') return false;
    const d = new Date(t.deadline);
    return !isNaN(d.getTime()) && d <= threeDaysLater;
  });

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 50;

  // Weekly stats matching screenshot (Sen, Sel, Rab, Kam, Jum, Sab, Min)
  const weeklyStats = [
    { day: 'Sen', completed: 4 },
    { day: 'Sel', completed: 6 },
    { day: 'Rab', completed: 3 },
    { day: 'Kam', completed: 5 },
    { day: 'Jum', completed: 7 },
    { day: 'Sab', completed: 3 },
    { day: 'Min', completed: 0 },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Hero Banner (Deep Navy with Dark Black Capsule Button) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#182234] text-white p-6 md:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>VoiceTask AI Productivity Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Halo, {user?.name?.split(' ')[0] || 'Sarah'}! Apa yang ingin kamu kerjakan hari ini?
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Cukup berbicara santai—AI kami akan memisahkan, merapikan, dan mengatur jadwalmu secara otomatis.
            </p>
          </div>

          {/* Right Action: Sleek Dark Capsule Button with Pink Mic */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={onOpenVoiceModal}
              className="px-4 py-2.5 bg-[#0a0f18] hover:bg-black text-white text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-2 shadow-sm transition-all cursor-pointer group"
            >
              <Mic className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Tekan untuk Berbicara</span>
            </button>
            <button
              onClick={onOpenNewTaskModal}
              className="p-2.5 bg-[#0a0f18] hover:bg-black text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Tambah Tugas Manual"
            >
              <Plus className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row (4 Clean Cards with Circular Rose Icon Badges on Top Right) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Tugas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold text-slate-700">Total Tugas</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {pendingTasks} belum selesai · {completedTasks} selesai
          </div>
        </div>

        {/* Card 2: Belum Selesai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold text-slate-700">Belum Selesai</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pendingTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Butuh tindakan segera
          </div>
        </div>

        {/* Card 3: Mendekati Deadline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold text-slate-700">Mendekati Deadline</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{nearDeadlineTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Jatuh tempo dalam 3 hari
          </div>
        </div>

        {/* Card 4: Prioritas Tinggi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold text-slate-700">Prioritas Tinggi</span>
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{highPriorityTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Perlu perhatian utama
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Tasks + Productivity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tugas Mendesak & Penting</h2>
                <p className="text-xs text-slate-400">Pekerjaan dengan prioritas tinggi dan batas waktu terdekat</p>
              </div>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'Selesai').slice(0, 5).map((task) => {
                const formattedDate = task.deadline
                  ? new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : 'Fleksibel';

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-100 bg-white transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Rounded Square Checkbox */}
                      <button
                        onClick={() => onToggleTaskStatus(task.id, task.status)}
                        className="mt-0.5 w-5 h-5 rounded-md border border-slate-300 hover:border-slate-500 flex items-center justify-center text-white bg-white transition-colors shrink-0 cursor-pointer"
                        title="Tandai selesai"
                      >
                        {task.status === 'Selesai' && <Check className="w-3.5 h-3.5 text-slate-900" />}
                      </button>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Tag Pills matching screenshot */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {/* Category Pill (Blue) */}
                          <span className="bg-blue-50 text-blue-600 border border-blue-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-medium inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-500" />
                            <span>{task.category}</span>
                          </span>

                          {/* Priority Pill (Rose) */}
                          <span className="bg-rose-50 text-rose-600 border border-rose-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-medium inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-500" />
                            <span>{task.priority}</span>
                          </span>

                          {/* Date Pill (Slate) */}
                          {task.deadline && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-medium inline-flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-slate-400" />
                              <span>{formattedDate}</span>
                            </span>
                          )}

                          {/* Source Pill (Slate) */}
                          <span className="bg-slate-100 text-slate-600 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-[10px] font-medium inline-flex items-center gap-1">
                            <Mic className="w-3 h-3 text-slate-400" />
                            <span>{task.source}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      {task.status}
                    </span>
                  </div>
                );
              })}

              {tasks.filter(t => t.status !== 'Selesai').length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  Semua tugas sudah selesai! Tekan tombol mikrofon untuk menambahkan pekerjaan baru.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tingkat Productivity & Tugas Selesai Pekan Ini */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-5">
            {/* Tingkat Productivity Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">Tingkat Productivity</h3>
                <span className="text-xs font-bold text-slate-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#182234] rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Tugas Selesai Pekan Ini Chart */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-semibold text-slate-700 mb-3">Tugas Selesai Pekan Ini</h4>
              <div className="grid grid-cols-7 gap-2 items-end h-24">
                {weeklyStats.map((st, i) => {
                  const maxVal = 7;
                  const heightPct = Math.max(8, Math.round((st.completed / maxVal) * 100));
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-semibold text-slate-500">{st.completed}</span>
                      <div
                        className="w-full rounded-t-sm bg-[#182234] transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-slate-400 font-medium">{st.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
