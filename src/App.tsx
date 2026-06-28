/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { OnboardingProvider } from './context/OnboardingContext';
import Header from './components/Header';
import Welcome from './pages/Welcome';
import ChooseMethod from './pages/ChooseMethod';
import ManualQuiz from './pages/ManualQuiz';
import VoiceOnboarding from './pages/VoiceOnboarding';
import Review from './pages/Review';
import Success from './pages/Success';

function AnimatedAppContent() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 text-gray-800 font-sans selection:bg-denim-100 selection:text-denim-900">
      {/* Premium Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/choose-method" element={<ChooseMethod />} />
            <Route path="/manual-quiz" element={<ManualQuiz />} />
            <Route path="/voice-onboarding" element={<VoiceOnboarding />} />
            <Route path="/review" element={<Review />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Minimalistic Premium Footer */}
      <footer className="py-6 text-center border-t border-gray-100 bg-white text-[10px] font-sans tracking-widest text-gray-400 uppercase">
        © 2026 Jackie Jeans CO. All Rights Reserved.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <OnboardingProvider>
      <Router>
        <AnimatedAppContent />
      </Router>
    </OnboardingProvider>
  );
}
