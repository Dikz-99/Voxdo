import React from 'react';

interface AudioWaveformProps {
  isListening: boolean;
  audioLevel?: number; // 0 to 100
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isListening,
  audioLevel = 0,
  barCount = 24,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16 px-4">
      {Array.from({ length: barCount }).map((_, index) => {
        // Create natural wave variation
        const centerOffset = Math.abs(index - barCount / 2) / (barCount / 2);
        const factor = Math.max(0.15, 1 - centerOffset * 0.7);
        
        let heightPercent = 8;
        if (isListening) {
          const pseudoNoise = Math.sin((index + Date.now() / 200) * 0.8) * 15;
          const dynamicLevel = (audioLevel * 0.85 + pseudoNoise) * factor;
          heightPercent = Math.max(12, Math.min(100, Math.round(dynamicLevel)));
        }

        return (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              isListening
                ? 'bg-gradient-to-t from-rose-500 via-pink-500 to-purple-400'
                : 'bg-slate-200'
            }`}
            style={{
              height: `${heightPercent}%`,
              opacity: isListening ? 0.75 + (heightPercent / 100) * 0.25 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};
