import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Task } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CalendarViewProps {
  tasks: Task[];
  onOpenVoiceModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onOpenVoiceModal }) => {
  // Center around November 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 10 = November (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Group tasks by day in this month
  const getTasksForDay = (day: number) => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    });
  };

  const selectedDateTasks = getTasksForDay(selectedDay);

  const handleExportICS = () => {
    window.open(api.getExportCalendarUrl(), '_blank');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kalender Aktivitas</h1>
          <p className="text-xs text-slate-500">
            Jadwal pekerjaan dan integrasi kalender produktivitas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportICS}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Download file .ics untuk Google Calendar / Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Ekspor Google Calendar (.ics)</span>
          </button>
          <button
            onClick={onOpenVoiceModal}
            className="px-3.5 py-2 bg-[#182234] hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-300" />
            <span>Jadwalkan via Suara</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar Month Matrix + Day Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Month Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty offset slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-lg bg-slate-50/50" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const isSelected = selectedDay === day;
              const isToday =
                currentYear === 2026 && currentMonth === 9 && day === 31; // Oct 31, 2026

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 p-1.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                      : isToday
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? 'text-rose-600'
                          : isToday
                          ? 'text-rose-500 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>

                  {/* Tasks preview in cell */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="text-[9px] truncate px-1 py-0.5 bg-slate-100 text-slate-700 rounded font-medium"
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        +{dayTasks.length - 2} lagi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Day Schedule */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-semibold text-slate-400">Jadwal Harian</span>
            <h3 className="text-base font-bold text-slate-900">
              {selectedDay} {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>

          <div className="space-y-2.5">
            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{task.title}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      task.priority === 'Tinggi' ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="text-[11px] text-slate-500">{task.description}</p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.execution_time || 'Waktu fleksibel'}</span>
                  <span>·</span>
                  <span>{task.category}</span>
                </div>
              </div>
            ))}

            {selectedDateTasks.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Tidak ada jadwal tugas untuk tanggal ini.</p>
                <button
                  onClick={onOpenVoiceModal}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Jadwalkan dengan suara
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
