import React from 'react';
import {
  History,
  Trash2,
  RefreshCw,
  Sparkles,
  Calendar,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { VoiceHistoryItem } from '../types/index.ts';

interface VoiceHistoryProps {
  history: VoiceHistoryItem[];
  onDeleteHistory: (id: string) => void;
  onReProcess: (transcript: string) => void;
  onOpenVoiceModal: () => void;
}

export const VoiceHistory: React.FC<VoiceHistoryProps> = ({
  history,
  onDeleteHistory,
  onReProcess,
  onOpenVoiceModal,
}) => {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Suara</h1>
          <p className="text-xs text-slate-500">
            Arsip percakapan dan instruksi suara yang telah diproses oleh AI
          </p>
        </div>

        <button
          onClick={onOpenVoiceModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Mic className="w-4 h-4" />
          <span>Rekam Suara Baru</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 transition-all hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>·</span>
                <span className="font-semibold text-blue-600">
                  {item.processed_result.tasks_count} tugas diekstraksi
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onReProcess(item.original_transcript)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                  title="Proses ulang transkrip ini dengan AI"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Proses Ulang</span>
                </button>
                <button
                  onClick={() => onDeleteHistory(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Hapus riwayat ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Original transcript */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-800 italic leading-relaxed">
              "{item.original_transcript}"
            </div>

            {/* AI Summary and Tasks extracted */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Hasil Ekstraksi AI:</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 pl-5 list-disc">
                {item.processed_result.tasks_summary.map((summary, idx) => (
                  <li key={idx}>{summary}</li>
                ))}
              </ul>
              {item.processed_result.ai_feedback && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Feedback AI: "{item.processed_result.ai_feedback}"
                </p>
              )}
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Suara</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Semua percakapan dan instruksi yang Anda ucapkan akan tercatat secara rapi di halaman ini.
            </p>
            <button
              onClick={onOpenVoiceModal}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Mulai Rekam Suara Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
