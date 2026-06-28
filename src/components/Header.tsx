/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, RefreshCw, ChevronLeft } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { method, resetProfile } = useOnboarding();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to start over? This will clear all your answers.')) {
      resetProfile();
      navigate('/');
    }
  };

  const showBackButton = location.pathname !== '/' && location.pathname !== '/success';
  const showResetButton = location.pathname !== '/' && location.pathname !== '/choose-method' && location.pathname !== '/success';

  const getSubtext = () => {
    if (location.pathname === '/choose-method') return 'Select onboarding method';
    if (location.pathname === '/manual-quiz') return 'Smart Fit Quiz';
    if (location.pathname === '/voice-onboarding') return 'Talk with Jackie AI';
    if (location.pathname === '/review') return 'Review Fit Profile';
    if (location.pathname === '/success') return 'Fit Profile Created';
    return 'Premium Denim Sizing';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-editorial-border bg-warm-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: Back Button or Empty Space to balance */}
        <div className="w-20">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-denim-700"
              style={{ minHeight: '44px', minWidth: '44px' }}
              id="header-back-button"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>

        {/* Center: Brand Identity */}
        <div className="flex flex-col items-center text-center">
          <button
            onClick={() => {
              if (location.pathname !== '/') {
                if (window.confirm('Go to home page? Your active quiz progress will be kept.')) {
                  navigate('/');
                }
              }
            }}
            className="group flex flex-col items-center focus:outline-none"
            id="header-logo-button"
          >
            <h1 className="font-display text-lg font-bold tracking-tighter uppercase text-editorial-text transition-colors group-hover:text-denim-700 sm:text-xl">
              JACKIE <span className="font-light text-denim-700">JEANS</span>
            </h1>
            <div className="flex items-center gap-1 text-[9px] font-semibold tracking-widest uppercase text-gray-400">
              {location.pathname === '/voice-onboarding' && (
                <Sparkles className="h-2.5 w-2.5 text-denim-700 animate-pulse" />
              )}
              <span>{getSubtext()}</span>
            </div>
          </button>
        </div>

        {/* Right Side: Reset Button */}
        <div className="flex w-20 justify-end">
          {showResetButton && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-red-500"
              style={{ minHeight: '44px' }}
              title="Start Over"
              id="header-reset-button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Restart</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
