/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ClipboardList, ArrowRight, Mic } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';

export default function ChooseMethod() {
  const navigate = useNavigate();
  const { setMethod } = useOnboarding();

  const handleSelectMethod = (type: 'manual' | 'voice') => {
    setMethod(type);
    if (type === 'manual') {
      navigate('/manual-quiz');
    } else {
      navigate('/voice-onboarding');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl border-x border-b border-editorial-border bg-warm-bg"
      id="choose-method-page"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-10rem)]">
        
        {/* Left Panel: Editorial Hero */}
        <div className="col-span-12 md:col-span-5 p-8 sm:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-editorial-border">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-denim-700 mb-4 block">
            Method Selection
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[0.95] tracking-tighter text-editorial-text mb-6">
            Find your <br/>
            <span className="italic font-serif">Perfect</span> Fit.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-sm mb-10 font-light">
            Stop guessing your jean size. Complete a quick fit quiz and discover your bespoke silhouette in under 2 minutes.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-denim-100/40 flex items-center justify-center text-denim-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-editorial-text">Two Seamless Paths</p>
                <p className="text-[11px] text-gray-500">Pick standard multiple-choice or talk naturally</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Selection Cards */}
        <div className="col-span-12 md:col-span-7 bg-warm-muted p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center gap-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-2">
            Select Your Method
          </h2>

          <div className="w-full max-w-lg flex flex-col gap-6" id="method-options-grid">
            
            {/* Manual Quiz Card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleSelectMethod('manual')}
              className="group bg-white p-6 sm:p-8 rounded-3xl border border-editorial-border shadow-sm hover:shadow-md hover:border-denim-700 transition-all cursor-pointer relative overflow-hidden"
              id="method-card-manual"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-editorial-text group-hover:text-denim-700 transition-colors font-display">
                    Quick Fit Quiz
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm font-light leading-relaxed">
                    Complete the fit quiz yourself with our step-by-step manual selector.
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warm-muted flex items-center justify-center text-gray-500 group-hover:bg-denim-700 group-hover:text-white transition-all">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="text-[9px] px-2.5 py-1 bg-warm-muted rounded-md font-bold uppercase text-gray-500">
                  8 Questions
                </span>
                <span className="text-[9px] px-2.5 py-1 bg-warm-muted rounded-md font-bold uppercase text-gray-500">
                  Manual Entry
                </span>
              </div>
            </motion.div>

            {/* Voice AI Card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleSelectMethod('voice')}
              className="group bg-white p-6 sm:p-8 rounded-3xl border-2 border-denim-700 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              id="method-card-voice"
            >
              <div className="absolute top-0 right-0 p-2.5 bg-denim-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-bl-xl">
                Recommended
              </div>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 text-editorial-text font-display">
                    Talk with Jackie AI
                    <span className="flex gap-1">
                      <span className="w-0.5 h-3 bg-denim-700 animate-pulse rounded-full"></span>
                      <span className="w-0.5 h-4 bg-denim-700 animate-pulse rounded-full" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-0.5 h-2 bg-denim-700 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }}></span>
                    </span>
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm font-light leading-relaxed">
                    Answer naturally using your voice. Our AI will calculate your measurements instantly.
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-denim-700 text-white flex items-center justify-center shadow-md">
                  <Mic className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="text-[9px] px-2.5 py-1 bg-denim-100/50 rounded-md font-bold uppercase text-denim-700">
                  Hands Free
                </span>
                <span className="text-[9px] px-2.5 py-1 bg-denim-100/50 rounded-md font-bold uppercase text-denim-700">
                  Fastest
                </span>
              </div>
            </motion.div>

          </div>

          <p className="text-[10px] text-gray-400 mt-4">
            Privacy Secured: Your measurements are only used for size calculation.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
