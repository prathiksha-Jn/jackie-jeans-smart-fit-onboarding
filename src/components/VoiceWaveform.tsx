/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceWaveformProps {
  state: 'speaking' | 'listening' | 'idle' | 'error';
  errorMessage?: string | null;
}

export default function VoiceWaveform({ state, errorMessage }: VoiceWaveformProps) {
  // We'll create 9 bars for the waveform visualization
  const barCount = 9;
  const bars = Array.from({ length: barCount });

  // Custom animation configs for bars depending on states
  const getBarVariants = (index: number) => {
    if (state === 'speaking') {
      // AI is talking - fast rhythmic movement
      const heights = [16, 48, 32, 64, 40, 72, 48, 36, 16];
      const baseHeight = heights[index] || 30;
      return {
        animate: {
          height: [baseHeight * 0.4, baseHeight, baseHeight * 0.4],
          transition: {
            duration: 0.8 + (index % 3) * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.08,
          },
        },
      };
    } else if (state === 'listening') {
      // Browser is listening - soft organic glowing pulse
      const heights = [20, 36, 44, 52, 60, 52, 44, 36, 20];
      const baseHeight = heights[index] || 25;
      return {
        animate: {
          height: [baseHeight * 0.6, baseHeight * 1.3, baseHeight * 0.6],
          transition: {
            duration: 1.2 + (index % 2) * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.1,
          },
        },
      };
    } else if (state === 'error') {
      // Error state - flat low vibration or static
      return {
        animate: {
          height: [12, 16, 12],
          transition: {
            duration: 2.0,
            repeat: Infinity,
            ease: 'linear',
          },
        },
      };
    } else {
      // Idle - thin line with tiny slow drift
      return {
        animate: {
          height: [12, 14, 12],
          transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.15,
          },
        },
      };
    }
  };

  const getStatusStyle = () => {
    switch (state) {
      case 'speaking':
        return {
          containerClass: 'bg-white border-editorial-border shadow-sm',
          badgeClass: 'bg-denim-700 text-white shadow-sm',
          badgeText: 'Jackie Speaking',
          icon: <Volume2 className="h-4 w-4 animate-bounce" />,
          ringClass: 'ring-blue-100',
        };
      case 'listening':
        return {
          containerClass: 'bg-white border-editorial-border shadow-sm',
          badgeClass: 'bg-emerald-700 text-white shadow-sm animate-pulse',
          badgeText: 'Listening...',
          icon: <Mic className="h-4 w-4" />,
          ringClass: 'ring-emerald-100 animate-ping',
        };
      case 'error':
        return {
          containerClass: 'bg-white border-editorial-border shadow-sm',
          badgeClass: 'bg-red-700 text-white shadow-sm',
          badgeText: 'System Notice',
          icon: <AlertCircle className="h-4 w-4" />,
          ringClass: 'ring-red-100',
        };
      case 'idle':
      default:
        return {
          containerClass: 'bg-white border-editorial-border shadow-sm',
          badgeClass: 'bg-warm-muted border border-editorial-border text-gray-500 shadow-sm',
          badgeText: 'Standby',
          icon: <Sparkles className="h-4 w-4 text-gray-300" />,
          ringClass: 'ring-gray-100',
        };
    }
  };

  const currentStyle = getStatusStyle();

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-3xl border p-8 shadow-sm transition-all duration-500 max-w-sm w-full mx-auto ${currentStyle.containerClass}`}
      id="voice-waveform-card"
    >
      {/* Outer Pulse Indicator for Listening State */}
      {state === 'listening' && (
        <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Main Waveform Animation Track */}
      <div className="flex h-32 items-center justify-center gap-2" id="waveform-bars-container">
        {bars.map((_, i) => (
          <motion.div
            key={i}
            className={`w-2.5 rounded-full transition-colors duration-300 ${
              state === 'speaking'
                ? 'bg-denim-700'
                : state === 'listening'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : state === 'error'
                ? 'bg-red-400'
                : 'bg-gray-300'
            }`}
            variants={getBarVariants(i)}
            animate="animate"
          />
        ))}
      </div>

      {/* State Badge */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase shadow-md transition-colors duration-300 ${currentStyle.badgeClass}`}>
          {currentStyle.icon}
          <span>{currentStyle.badgeText}</span>
        </div>
        
        {state === 'error' && errorMessage && (
          <p className="mt-2 text-center text-xs text-red-600 px-4 font-sans leading-relaxed">
            {errorMessage}
          </p>
        )}
        
        {state === 'listening' && (
          <p className="mt-2 text-center text-xs text-emerald-700 animate-pulse font-medium">
            Speak clearly into your microphone
          </p>
        )}
        
        {state === 'speaking' && (
          <p className="mt-2 text-center text-xs text-blue-700 font-medium">
            Listen to Jackie's question...
          </p>
        )}
      </div>
    </div>
  );
}
