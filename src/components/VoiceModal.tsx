import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Tag,
  Trash2,
  Plus,
  Volume2,
  RefreshCw,
  X,
  Calendar,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform.tsx';
import { api } from '../services/api.ts';
import { ParsedVoiceTask, TaskPriority } from '../types/index.ts';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksSaved: () => void;
  // Speech controls from useSpeech hook
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  setTranscript: (text: string) => void;
  interimTranscript: string;
  audioLevel: number;
  speechError: string | null;
  speak: (text: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  onUpgradePrompt: () => void;
}

const SAMPLE_PROMPTS = [
  'Besok pagi saya harus menghubungi Pak Andi tentang proyek website, terus siang jangan lupa kirim laporan ke kantor, dan hari Jumat saya harus menyelesaikan desain aplikasi.',
  'Nanti sore jam 4 beli bahan kopi dan vitamin di supermarket, terus malamnya review pull request tim frontend.',
  'Senin depan jam 10 pagi ada rapat sprint mingguan dengan klien, lalu selesaikan penagihan invoice sebelum jam 3 sore.',
];

const CATEGORIES = ['Pekerjaan', 'Proyek', 'Pribadi', 'Belajar', 'Keuangan', 'Kesehatan'];
const PRIORITIES: TaskPriority[] = ['Tinggi', 'Sedang', 'Rendah'];

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onTasksSaved,
  isListening,
  startListening,
  stopListening,
  transcript,
  setTranscript,
  interimTranscript,
  audioLevel,
  speechError,
  speak,
  isSpeaking,
  stopSpeaking,
  onUpgradePrompt,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedVoiceTask[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [isSaving, setIsSaving] = useState(false);

  // Sync spoken transcript to input text
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('record');
      setParsedTasks([]);
      setAiFeedback('');
      setClarificationQuestion(null);
      setErrorMsg(null);
    } else {
      if (isListening) stopListening();
      if (isSpeaking) stopSpeaking();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setErrorMsg(null);
      startListening();
    }
  };

  const handleProcessWithAI = async (textToProcess?: string) => {
    const raw = textToProcess !== undefined ? textToProcess : inputText;
    const finalPrompt = (raw + (interimTranscript ? ' ' + interimTranscript : '')).trim();

    if (!finalPrompt) {
      setErrorMsg('Silakan berbicara atau ketik kalimat tugas terlebih dahulu.');
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const result = await api.parseVoice(finalPrompt, '2026-10-31T11:38:00');
      setParsedTasks(result.tasks);
      setAiFeedback(result.ai_response);
      setClarificationQuestion(result.clarification_question || null);
      setStep('review');

      // Speak feedback via TTS
      if (result.ai_response) {
        speak(result.ai_response);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('kuota')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Gagal memproses suara. Pastikan Gemini API key aktif atau coba lagi.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskChange = (index: number, field: keyof ParsedVoiceTask, value: any) => {
    setParsedTasks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewTask = () => {
    setParsedTasks(prev => [
      ...prev,
      {
        title: 'Tugas Baru',
        description: '',
        category: 'Pekerjaan',
        priority: 'Sedang',
        deadline: '',
        execution_time: 'Fleksibel',
        confidence: 1.0,
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (parsedTasks.length === 0) {
      setErrorMsg('Tidak ada tugas untuk disimpan.');
      return;
    }

    setIsSaving(true);
    try {
      await api.createBatchTasks(parsedTasks);
      onTasksSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan tugas ke database: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-rose-400 border border-slate-700/80 flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {step === 'record' ? 'Voice-to-Task AI' : 'Tinjau & Konfirmasi Tugas'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {step === 'record'
                  ? 'Bicara secara alami dalam Bahasa Indonesia'
                  : 'AI telah menstrukturkan ucapanmu menjadi tugas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                {errorMsg.includes('kuota') && (
                  <button
                    onClick={onUpgradePrompt}
                    className="mt-1.5 font-bold text-rose-700 underline block cursor-pointer"
                  >
                    Upgrade ke Premium sekarang &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {speechError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>{speechError}</p>
            </div>
          )}

          {step === 'record' ? (
            <div className="space-y-6">
              {/* Central Mic & Waveform Area */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4 text-center">
                <div className="relative mb-4">
                  {/* Outer pulsating rings when listening */}
                  {isListening && (
                    <div className="absolute inset-0 -m-3 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                  <button
                    onClick={handleToggleListening}
                    disabled={isProcessing}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-lg cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-200 animate-pulse'
                        : 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-100 shadow-rose-500/25'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <span className="text-xs font-semibold text-slate-700">
                  {isListening ? 'Mendengarkan... Silakan berbicara' : 'Tekan untuk Mulai Berbicara'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung kalimat panjang dan multi-tugas sekaligus
                </span>

                {/* Animated Waveform */}
                <div className="w-full max-w-sm mt-3">
                  <AudioWaveform isListening={isListening} audioLevel={audioLevel} />
                </div>
              </div>

              {/* Transcript Display & Editable Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">
                    Teks Hasil Suara (Dapat Diedit):
                  </label>
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText('');
                        setTranscript('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Hapus Teks
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ucapan Anda akan muncul otomatis di sini, atau Anda dapat mengetik langsung..."
                    className="w-full text-xs text-slate-800 placeholder-slate-400 p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all leading-relaxed"
                  />
                  {interimTranscript && (
                    <p className="text-[11px] text-blue-600 italic px-3 pb-2 font-medium">
                      Sedang berbicara: "{interimTranscript}"
                    </p>
                  )}
                </div>
              </div>

              {/* Sample Voice Prompts for Quick Testing */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Contoh Kalimat Siap Coba:</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(sample);
                        handleProcessWithAI(sample);
                      }}
                      className="text-left text-xs text-slate-600 hover:text-blue-700 p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Review Step */
            <div className="space-y-5">
              {/* AI Voice Feedback Banner */}
              {aiFeedback && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">Respon Asisten AI:</span>
                      <button
                        onClick={() => speak(aiFeedback)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengarkan Lagi</span>
                      </button>
                    </div>
                    <p className="mt-1 text-blue-800 leading-relaxed">{aiFeedback}</p>
                  </div>
                </div>
              )}

              {clarificationQuestion && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950">Catatan Klarifikasi AI:</span>
                    <p className="mt-0.5 text-amber-800">{clarificationQuestion}</p>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Hasil Ekstraksi Tugas ({parsedTasks.length} pekerjaan):
                  </h4>
                  <button
                    onClick={handleAddNewTask}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tugas</span>
                  </button>
                </div>

                {parsedTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Judul Tugas</label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-900 p-1.5 border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors mt-3"
                        title="Hapus tugas ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Kategori</label>
                        <select
                          value={task.category}
                          onChange={(e) => handleTaskChange(idx, 'category', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400">Prioritas</label>
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            handleTaskChange(idx, 'priority', e.target.value as TaskPriority)
                          }
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400">Waktu Pelaksanaan</label>
                        <input
                          type="text"
                          value={task.execution_time || ''}
                          onChange={(e) => handleTaskChange(idx, 'execution_time', e.target.value)}
                          placeholder="e.g. Besok pagi 09:00"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step === 'record' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium px-3 py-1.5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleProcessWithAI()}
                disabled={isProcessing || (!inputText.trim() && !interimTranscript)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>Ubah Jadi Tugas (AI)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('record')}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium px-3 py-1.5"
              >
                &larr; Rekam Ulang
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving || parsedTasks.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  {isSaving ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Semua ({parsedTasks.length} Tugas)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
