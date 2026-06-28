/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-denim-700" />,
      title: 'Personalized Fit',
      description: 'Engineered algorithms match your custom proportions for zero waist-gap.'
    },
    {
      icon: <Sparkles className="h-5 w-5 text-denim-700" />,
      title: 'Jackie AI Assistant',
      description: 'Onboard naturally using voice chat or standard rapid sizing inputs.'
    },
    {
      icon: <Zap className="h-5 w-5 text-denim-700" />,
      title: 'Less Than 2 Minutes',
      description: 'Quick size predictions generated instantly upon quiz completion.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl border-x border-b border-editorial-border bg-warm-bg"
      id="welcome-page-container"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-10rem)]">
        
        {/* Left Panel: Editorial Hero */}
        <div className="col-span-12 md:col-span-5 p-8 sm:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-editorial-border">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-denim-700 mb-4 block">
            Onboarding 1.0
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-editorial-text">Personalized Fit</p>
                <p className="text-[11px] text-gray-500">Tailored to your specific body geometry</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-denim-100/40 flex items-center justify-center text-denim-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-editorial-text">AI Powered</p>
                <p className="text-[11px] text-gray-500">Jackie Voice Assistant guides you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Selection & Info */}
        <div className="col-span-12 md:col-span-7 bg-warm-muted p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center gap-8">
          
          {/* Styled Denim Graphic Mock */}
          <div className="relative w-full max-w-md flex justify-center">
            <div className="border border-editorial-border bg-white shadow-sm rounded-3xl p-6 w-full text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-denim-50 rounded-bl-full flex items-center justify-center">
                <span className="text-denim-700 font-bold font-display text-xs">A+</span>
              </div>
              <div className="font-serif text-lg font-medium text-editorial-text">Custom Fit Model</div>
              <p className="text-xs text-gray-400 mt-1">Based on over 25,000 custom physical bodies</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {['Waist', 'Hips', 'Thighs', 'Length'].map((label) => (
                  <span key={label} className="bg-warm-bg border border-editorial-border px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md lg:max-w-xl" id="features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center text-center p-4 bg-white border border-editorial-border rounded-2xl"
              >
                <div className="mb-3 rounded-full bg-denim-50 p-2 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xs font-bold text-editorial-text uppercase tracking-wider mb-1">
                  {feature.title}
                </h3>
                <p className="font-sans text-[11px] text-gray-500 leading-normal font-light">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Start Button CTA */}
          <div className="w-full max-w-md flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/choose-method')}
              className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-denim-700 px-8 py-4 text-xs font-bold tracking-widest uppercase text-white shadow-md transition-all duration-300 hover:bg-denim-800"
              style={{ minHeight: '48px' }}
              id="start-journey-button"
            >
              <span>Start Your Fit Journey</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <p className="text-[10px] text-gray-400 mt-4 text-center">
              Privacy Secured: Your measurements are only used for size calculation.
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
