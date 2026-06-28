/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Edit3, Check, User, Ruler, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';

export default function Review() {
  const navigate = useNavigate();
  const { fitProfile, method } = useOnboarding();

  // Helper to handle edit deep linking
  const handleEditField = (stepId: string) => {
    // If the original method was voice, we still route them to manual-quiz for editing because form-editing is far more precise and convenient for quick corrections!
    navigate(`/manual-quiz?stepId=${stepId}`);
  };

  const hasBrands = fitProfile.brands.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl px-4 py-8 sm:py-16"
      id="review-page-container"
    >
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-editorial-text">
          Review Your Fit Profile
        </h2>
        <p className="mt-2 text-sm text-gray-500 font-sans font-light">
          Confirm your measurements and style choices. We'll use this to calibrate your bespoke denim profile.
        </p>
      </div>

      <div className="space-y-6" id="review-cards-list">
        
        {/* Card 1: Physical Proportions */}
        <div className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm relative overflow-hidden" id="review-card-proportions">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2.5">
              <div className="bg-warm-muted border border-editorial-border text-denim-700 p-2 rounded-xl">
                <User className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-editorial-text">Physical Proportions</h3>
            </div>
            <button
              onClick={() => handleEditField('height')}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-denim-700 hover:bg-warm-muted px-3 py-1.5 rounded-md border border-editorial-border transition-colors cursor-pointer"
              style={{ minHeight: '40px' }}
              id="edit-btn-proportions"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Height</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.height || 'Not Answered'}</span>
            </div>
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weight</span>
              <span className="text-base font-bold text-editorial-text font-serif">
                {fitProfile.weight === 'Skipped' || !fitProfile.weight ? 'Skipped' : `${fitProfile.weight} lbs`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Denim Fit Preferences */}
        <div className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm relative overflow-hidden" id="review-card-preferences">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2.5">
              <div className="bg-warm-muted border border-editorial-border text-denim-700 p-2 rounded-xl">
                <Ruler className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-editorial-text">Fit & Style Preferences</h3>
            </div>
            <button
              onClick={() => handleEditField('waist')}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-denim-700 hover:bg-warm-muted px-3 py-1.5 rounded-md border border-editorial-border transition-colors cursor-pointer"
              style={{ minHeight: '40px' }}
              id="edit-btn-preferences"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Waist size</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.waist ? `${fitProfile.waist} in` : 'Not Answered'}</span>
            </div>
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hip size</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.hips ? `${fitProfile.hips} in` : 'Not Answered'}</span>
            </div>
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Waist Fit</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.waistPreference || 'Not Answered'}</span>
            </div>
            <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Waistband Position</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.waistbandPosition || 'Not Answered'}</span>
            </div>
            <div className="col-span-2 bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Thigh Fit</span>
              <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.thighFit || 'Not Answered'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Brand History & Sizing */}
        <div className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm relative overflow-hidden" id="review-card-brands">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2.5">
              <div className="bg-warm-muted border border-editorial-border text-denim-700 p-2 rounded-xl">
                <Award className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-editorial-text">Brand Sizes & Calibration</h3>
            </div>
            <button
              onClick={() => handleEditField('brands')}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-denim-700 hover:bg-warm-muted px-3 py-1.5 rounded-md border border-editorial-border transition-colors cursor-pointer"
              style={{ minHeight: '40px' }}
              id="edit-btn-brands"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {hasBrands ? (
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Purchased Brands & Sizing</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {fitProfile.brands.map((brand) => (
                  <div key={brand} className="flex items-center justify-between bg-warm-muted border border-editorial-border px-3.5 py-2.5 rounded-xl">
                    <span className="text-xs font-bold text-editorial-text uppercase tracking-wider">{brand}</span>
                    <span className="bg-denim-700 text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                      Size: {fitProfile.brandSizes[brand] || 'Not selected'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-red-500 font-sans font-light">
              No brands selected. Please edit brand options.
            </div>
          )}
        </div>

        {/* Card 4: Fit Frustrations */}
        <div className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm relative overflow-hidden" id="review-card-frustration">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2.5">
              <div className="bg-warm-muted border border-editorial-border text-denim-700 p-2 rounded-xl">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-serif text-base font-semibold text-editorial-text">Core Sizing Obstacles</h3>
            </div>
            <button
              onClick={() => handleEditField('frustration')}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-denim-700 hover:bg-warm-muted px-3 py-1.5 rounded-md border border-editorial-border transition-colors cursor-pointer"
              style={{ minHeight: '40px' }}
              id="edit-btn-frustration"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="bg-warm-muted border border-editorial-border/40 p-3.5 rounded-2xl">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Biggest Frustration</span>
            <span className="text-base font-bold text-editorial-text font-serif">{fitProfile.frustration || 'Not Answered'}</span>
          </div>
        </div>

      </div>

      {/* Navigation Controls Footer */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <button
          onClick={() => navigate('/success')}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-denim-700 py-4 text-xs font-bold tracking-widest uppercase text-white shadow-sm hover:bg-denim-800 transition-all cursor-pointer"
          style={{ minHeight: '48px' }}
          id="finish-review-button"
        >
          <Check className="h-4 w-4" />
          <span>Confirm & Create Profile</span>
        </button>
        
        <p className="text-[10px] text-gray-400 font-sans font-light">
          By clicking confirm, you agree to formulate your Jackie Jeans Fit Profile.
        </p>
      </div>
    </motion.div>
  );
}
