import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Check,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Mic,
  ArrowUpDown,
  Tag,
  AlertCircle,
  X,
  FileText,
  Lock,
  Download,
  BookOpen,
  Flame
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskSource } from '../types/index.ts';
import { api } from '../services/api.ts';

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (taskId: string, currentStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onOpenVoiceModal: () => void;
  searchQuery: string;
  isPremium?: boolean;
  onUpgradePrompt?: () => void;
}

const CATEGORIES = ['Semua', 'Pekerjaan', 'Proyek', 'Pribadi', 'Belajar', 'Keuangan', 'Kesehatan'];
const PRIORITIES = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];
const STATUSES = ['Semua', 'Belum Dimulai', 'Sedang Dikerjakan', 'Selesai'];

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onSaveTask,
  onOpenVoiceModal,
  searchQuery,
  isPremium = false,
  onUpgradePrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedPriority, setSelectedPriority] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'newest'>('newest');

  // Modal edit/create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter tasks
  let filtered = tasks.filter((t) => {
    if (selectedCategory !== 'Semua' && t.category !== selectedCategory) return false;
    if (selectedPriority !== 'Semua' && t.priority !== selectedPriority) return false;
    if (selectedStatus !== 'Semua' && t.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort tasks
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'priority') {
      const weight: Record<TaskPriority, number> = { Tinggi: 3, Sedang: 2, Rendah: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    // newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleOpenCreate = () => {
    setEditingTask({
      title: '',
      description: '',
      category: 'Pekerjaan',
      priority: 'Sedang',
      deadline: '',
      execution_time: '',
      status: 'Belum Dimulai',
      source: 'Manual',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask({ ...task });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title?.trim()) {
      setErrorMsg('Judul tugas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveTask(editingTask);
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Tugas</h1>
          <p className="text-xs text-slate-500">
            Total {filtered.length} dari {tasks.length} pekerjaan terdaftar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notion Sync Export Button */}
          <button
            onClick={() => {
              if (!isPremium) {
                if (onUpgradePrompt) onUpgradePrompt();
                else alert('Fitur Ekspor ke format Notion adalah fitur eksklusif Premium Plan. Silakan upgrade!');
              } else {
                window.open(api.getExportNotionUrl(), '_blank');
              }
            }}
            title={isPremium ? 'Unduh Format Database Notion (.md)' : 'Khusus Premium: Ekspor ke Notion'}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {isPremium ? <FileText className="w-3.5 h-3.5 text-slate-800" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Ekspor Notion</span>
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-xl border border-rose-200/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Mic className="w-4 h-4 text-rose-500" />
            <span>Tambah via Suara</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-[#182234] hover:bg-black text-white font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar (anti-slop clean segmented buttons) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 shrink-0">Kategori:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Prioritas:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:outline-none font-medium"
            >
              <option value="newest">Terbaru</option>
              <option value="deadline">Batas Waktu Terdekat</option>
              <option value="priority">Prioritas Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-2.5">
        {filtered.map((task) => {
          const isDone = task.status === 'Selesai';
          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border bg-white transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                isDone
                  ? 'border-slate-200/60 opacity-60 bg-slate-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Complete checkbox */}
                <button
                  onClick={() => onToggleStatus(task.id, task.status)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isDone
                      ? 'bg-[#182234] border-[#182234] text-white'
                      : 'border-slate-300 hover:border-slate-500 text-transparent'
                  }`}
                  title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Tag Pills matching theme */}
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
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
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

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    task.status === 'Selesai'
                      ? 'bg-emerald-50 text-emerald-700'
                      : task.status === 'Sedang Dikerjakan'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {task.status}
                </span>

                <button
                  onClick={() => handleOpenEdit(task)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Edit tugas"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Hapus tugas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <p className="text-sm text-slate-500">Tidak ada tugas yang sesuai dengan filter.</p>
            <button
              onClick={handleOpenCreate}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + Tambah tugas baru
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingTask.id ? 'Edit Tugas' : 'Tambah Tugas Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mengirim penawaran ke klien"
                  value={editingTask.title || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Detail catatan tambahan..."
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={editingTask.category || 'Pekerjaan'}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prioritas</label>
                  <select
                    value={editingTask.priority || 'Sedang'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none"
                  >
                    {PRIORITIES.filter((p) => p !== 'Semua').map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingTask.status || 'Belum Dimulai'}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none"
                  >
                    {STATUSES.filter((s) => s !== 'Semua').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Besok pagi 09:00"
                    value={editingTask.execution_time || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, execution_time: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
