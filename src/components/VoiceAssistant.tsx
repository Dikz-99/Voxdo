import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Flame,
  Bot
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform.tsx';
import { api } from '../services/api.ts';
import { Task, AssistantChatResponse } from '../types/index.ts';

interface VoiceAssistantProps {
  tasks: Task[];
  onTasksUpdated: () => void;
  // Speech controls from useSpeech
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  speechError: string | null;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: string;
}

const SAMPLE_COMMANDS = [
  'Apa saja tugas saya hari ini?',
  'Tugas mana yang paling mendesak?',
  'Buatkan jadwal pekerjaan untuk besok.',
  'Tandai pekerjaan laporan sebagai selesai.',
  'Tambahkan tugas meeting dengan tim produk jam 3 sore.',
];

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  tasks,
  onTasksUpdated,
  isListening,
  startListening,
  stopListening,
  transcript,
  interimTranscript,
  audioLevel,
  speechError,
  speak,
  stopSpeaking,
  isSpeaking,
  ttsEnabled,
  onToggleTTS,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Halo! Saya asisten VoiceTask AI. Kamu bisa bertanya tentang jadwal, meminta rekomendasi prioritas, atau memberi perintah untuk menambah dan menyelesaikan tugas hanya dengan suara atau teks.',
      timestamp: '11:38',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // When spoken transcript arrives
  React.useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (isListening) stopListening();

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response: AssistantChatResponse = await api.askAssistant(query);

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If action executed, trigger refresh
      if (response.action && response.action !== 'NONE') {
        onTasksUpdated();
      }

      // Voice TTS feedback
      if (ttsEnabled && response.reply) {
        speak(response.reply);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'Maaf, terjadi gangguan saat menghubungi AI. Silakan coba kembali.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      if (inputText.trim()) {
        handleSendMessage();
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-rose-400 flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">AI Voice Assistant</h1>
            <p className="text-xs text-slate-500">Percakapan cerdas & perintah suara interaktif</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTTS}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              ttsEnabled
                ? 'bg-rose-50 text-rose-600 border-rose-200/90'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{ttsEnabled ? 'Suara AI Aktif' : 'Suara AI Senyap'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Commands */}
      <div className="py-3 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Contoh:</span>
        </span>
        {SAMPLE_COMMANDS.map((cmd, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(cmd)}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 text-xs shrink-0 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-[#182234] text-white'
                    : 'bg-slate-800 text-rose-300 border border-slate-700'
                }`}
              >
                {isUser ? 'Kamu' : 'AI'}
              </div>

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 shadow-xs ${
                  isUser
                    ? 'bg-[#182234] text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-normal">{m.text}</div>
                {m.action && m.action !== 'NONE' && (
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aksi dieksekusi: {m.action}</span>
                  </div>
                )}
                <div
                  className={`text-[10px] text-right ${
                    isUser ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
            <span>AI sedang menyusun jawaban...</span>
          </div>
        )}
      </div>

      {/* Voice Waveform when listening */}
      {isListening && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Mendengarkan suara Anda...</span>
          </div>
          <div className="w-48">
            <AudioWaveform isListening={isListening} audioLevel={audioLevel} barCount={16} />
          </div>
          <button
            onClick={stopListening}
            className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
          >
            Selesai Bicara
          </button>
        </div>
      )}

      {/* Input Form with Big Mic Integration */}
      <div className="pt-3 border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300 focus-within:border-slate-800 transition-all shadow-xs"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-2.5 rounded-lg transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title={isListening ? 'Berhenti Bicara' : 'Mulai Bicara'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? 'Sedang mendengarkan ucapanmu...'
                : 'Tanyakan sesuatu atau katakan perintah tugas...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-2"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-[#182234] hover:bg-slate-900 disabled:bg-slate-200 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
