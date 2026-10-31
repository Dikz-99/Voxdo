import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Mic,
  PieChart,
  Award,
  Zap
} from 'lucide-react';
import { Task, VoiceHistoryItem } from '../types/index.ts';

interface StatisticsProps {
  tasks: Task[];
  voiceHistory: VoiceHistoryItem[];
}

export const Statistics: React.FC<StatisticsProps> = ({ tasks, voiceHistory }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Selesai').length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Breakdown by category
  const categoriesMap: Record<string, number> = {};
  for (const t of tasks) {
    categoriesMap[t.category] = (categoriesMap[t.category] || 0) + 1;
  }
  const categoryStats = Object.entries(categoriesMap).map(([cat, count]) => ({
    name: cat,
    count,
    percentage: Math.round((count / (total || 1)) * 100),
  }));

  // Breakdown by priority
  const highPriority = tasks.filter((t) => t.priority === 'Tinggi').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'Sedang').length;
  const lowPriority = tasks.filter((t) => t.priority === 'Rendah').length;

  // Source breakdown: Voice vs Manual
  const voiceCount = tasks.filter((t) => t.source === 'Suara').length;
  const manualCount = tasks.filter((t) => t.source === 'Manual').length;
  const voiceAdoptionRate = total > 0 ? Math.round((voiceCount / total) * 100) : 0;

  // Time saving estimation: ~3 minutes saved per voice-created task
  const minutesSaved = voiceCount * 3;
  const hoursSaved = (minutesSaved / 60).toFixed(1);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Statistik & Analisis Produktivitas</h1>
        <p className="text-xs text-slate-500">
          Metrik penyelesaian tugas, efisiensi waktu, dan adopsi asisten suara
        </p>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Tingkat Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{completionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{completed} dari {total} tugas selesai</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Estimasi Hemat Waktu</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">~{hoursSaved} Jam</div>
          <p className="text-[11px] text-slate-400 mt-1">Dicapai melalui voice-to-task cepat</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Adopsi Asisten Suara</span>
            <Mic className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{voiceAdoptionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{voiceCount} tugas dibuat lewat suara</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Sesi Suara AI</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{voiceHistory.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total percakapan diarsipkan</p>
        </div>
      </div>

      {/* Main Charts & Breakdown Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Distribusi Kategori Tugas</h3>
            <p className="text-xs text-slate-400">Pembagian fokus pekerjaan Anda</p>
          </div>

          <div className="space-y-3">
            {categoryStats.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="text-slate-400 font-medium">
                    {item.count} tugas ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority & Source Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Tingkat Prioritas & Sumber Input</h3>
            <p className="text-xs text-slate-400">Analisis intensitas kerja</p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-600">Prioritas Pekerjaan:</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                <div className="text-lg font-bold text-rose-600">{highPriority}</div>
                <div className="text-[11px] text-rose-800 font-medium">Tinggi</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="text-lg font-bold text-amber-600">{mediumPriority}</div>
                <div className="text-[11px] text-amber-800 font-medium">Sedang</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                <div className="text-lg font-bold text-slate-700">{lowPriority}</div>
                <div className="text-[11px] text-slate-600 font-medium">Rendah</div>
              </div>
            </div>
          </div>

          {/* Source Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600">Perbandingan Metode Input:</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-blue-700">{voiceCount} Tugas</div>
                  <div className="text-[11px] text-blue-600">Input Suara (AI)</div>
                </div>
                <Mic className="w-5 h-5 text-blue-400" />
              </div>

              <div className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-slate-700">{manualCount} Tugas</div>
                  <div className="text-[11px] text-slate-500">Input Manual</div>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
