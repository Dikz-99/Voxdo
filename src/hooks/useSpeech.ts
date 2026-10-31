import { useState, useEffect, useRef, useCallback } from 'react';

// Declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechSettings {
  ttsEnabled: boolean;
  rate: number;
  pitch: number;
  voiceURI?: string;
}

const DEFAULT_SETTINGS: SpeechSettings = {
  ttsEnabled: true,
  rate: 1.0,
  pitch: 1.0,
};

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState<SpeechSettings>(() => {
    try {
      const stored = localStorage.getItem('voicetask_speech_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Save settings
  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('voicetask_speech_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          setTranscript(prev => (prev ? `${prev} ${final}` : final));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Akses mikrofon ditolak. Izinkan izin mikrofon di browser Anda.');
        } else if (event.error === 'no-speech') {
          // Normal timeout if user pauses, don't show scary error
        } else {
          setSpeechError(`Error pengenalan suara: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to init speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      stopAudioVisualizer();
    };
  }, []);

  // Start visualizer
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLoop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLoop);
      };

      updateLoop();
    } catch (e) {
      console.warn('Could not start audio visualizer:', e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startListening = useCallback(async () => {
    setSpeechError(null);
    setInterimTranscript('');
    try {
      await startAudioVisualizer();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        setIsListening(true);
      }
    } catch (err: any) {
      setSpeechError(err.message || 'Gagal mengakses mikrofon.');
      setIsListening(false);
      stopAudioVisualizer();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopAudioVisualizer();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Text-To-Speech (TTS)
  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      // Find Indonesian voice if possible
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setIsSpeaking(false);
    }
  }, [settings]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim(),
    setTranscript,
    isSupported,
    audioLevel,
    speechError,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    stopSpeaking,
    isSpeaking,
    settings,
    updateSettings,
  };
}
