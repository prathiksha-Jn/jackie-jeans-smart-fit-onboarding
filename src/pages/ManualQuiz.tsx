/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import ProgressBar from '../components/ProgressBar';
import {
  FitProfile,
  HEIGHT_OPTIONS,
  WAIST_OPTIONS,
  HIP_OPTIONS,
  BRAND_OPTIONS,
  SIZE_OPTIONS,
  WAIST_PREF_OPTIONS,
  WAISTBAND_POSITION_OPTIONS,
  THIGH_FIT_OPTIONS,
  FRUSTRATION_OPTIONS,
} from '../types';

interface QuizStep {
  id: string;
  label: string;
  type: 'select' | 'number' | 'radio' | 'checkbox' | 'brand-size';
  questionText: string;
  options?: string[];
  placeholder?: string;
  required: boolean;
  skipEnabled?: boolean;
  brandName?: string;
}

export default function ManualQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fitProfile, updateField, updateBrandSize } = useOnboarding();

  // Compute the full flat list of steps (including dynamic brand size questions)
  const getSteps = (): QuizStep[] => {
    const steps: QuizStep[] = [
      {
        id: 'height',
        label: 'Height',
        type: 'select',
        questionText: 'What is your height?',
        options: HEIGHT_OPTIONS,
        required: true,
      },
      {
        id: 'weight',
        label: 'Weight',
        type: 'number',
        questionText: 'What is your weight? (Optional)',
        placeholder: 'e.g. 150 lbs',
        required: false,
        skipEnabled: true,
      },
      {
        id: 'waist',
        label: 'Waist Measurement',
        type: 'select',
        questionText: 'What is your waist measurement?',
        options: WAIST_OPTIONS,
        required: true,
      },
      {
        id: 'hips',
        label: 'Hip Measurement',
        type: 'select',
        questionText: 'What is your hip measurement?',
        options: HIP_OPTIONS,
        required: true,
      },
      {
        id: 'waistPreference',
        label: 'Waist Preference',
        type: 'radio',
        questionText: 'How do you prefer your jeans to fit around your waist?',
        options: WAIST_PREF_OPTIONS,
        required: true,
      },
      {
        id: 'waistbandPosition',
        label: 'Waistband Position',
        type: 'radio',
        questionText: 'Where do you prefer your waistband to sit?',
        options: WAISTBAND_POSITION_OPTIONS,
        required: true,
      },
      {
        id: 'thighFit',
        label: 'Thigh Fit',
        type: 'radio',
        questionText: 'What is your preferred thigh fit?',
        options: THIGH_FIT_OPTIONS,
        required: true,
      },
      {
        id: 'brands',
        label: 'Brands Purchased',
        type: 'checkbox',
        questionText: 'Which of these brands have you purchased in the past?',
        options: BRAND_OPTIONS,
        required: true,
      },
    ];

    // Inject dynamic brand size questions (Question 9)
    fitProfile.brands.forEach((brand) => {
      steps.push({
        id: `brand-size-${brand}`,
        label: `${brand} Size`,
        type: 'brand-size',
        brandName: brand,
        questionText: `What size do you usually wear in ${brand}?`,
        options: SIZE_OPTIONS,
        required: true,
      });
    });

    // Frustration Question (Question 10)
    steps.push({
      id: 'frustration',
      label: 'Fit Frustration',
      type: 'radio',
      questionText: 'What is your biggest fit frustration when buying jeans?',
      options: FRUSTRATION_OPTIONS,
      required: true,
    });

    return steps;
  };

  const steps = getSteps();

  // Find index of step requested via deep link (edit mode)
  const stepParam = searchParams.get('stepId');
  const initialStepIndex = stepParam
    ? steps.findIndex((s) => s.id === stepParam || (s.type === 'brand-size' && s.id === `brand-size-${stepParam}`))
    : 0;

  const [currentIndex, setCurrentIndex] = useState(initialStepIndex >= 0 ? initialStepIndex : 0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync index if query parameters change (e.g. user clicks another edit button)
  useEffect(() => {
    if (stepParam) {
      const idx = steps.findIndex((s) => s.id === stepParam || (s.type === 'brand-size' && s.id === `brand-size-${stepParam}`));
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [stepParam]);

  const currentStep = steps[currentIndex];

  // Helper to determine question number labels for header (not counting dynamic questions)
  const getStepHeaderLabel = () => {
    if (currentStep.type === 'brand-size') {
      return `Brand Sizing: ${currentStep.brandName}`;
    }

    // Map currentStep id to its static question position
    const staticIds = [
      'height',
      'weight',
      'waist',
      'hips',
      'waistPreference',
      'waistbandPosition',
      'thighFit',
      'brands',
      'frustration',
    ];
    const index = staticIds.indexOf(currentStep.id);
    const orderNumber = index !== -1 ? index + 1 : 1;
    // Weigh Question 10 appropriately
    const displayedOrder = currentStep.id === 'frustration' ? 10 : orderNumber;
    return `Question ${displayedOrder} of 10`;
  };

  // Check if current step's value is valid
  const isStepValid = (): boolean => {
    if (!currentStep.required) return true;

    if (currentStep.type === 'brand-size' && currentStep.brandName) {
      return !!fitProfile.brandSizes[currentStep.brandName];
    }

    const value = fitProfile[currentStep.id as keyof FitProfile];
    if (currentStep.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0;
    }

    return value !== undefined && value !== '';
  };

  const handleNext = () => {
    if (!isStepValid()) {
      setValidationError('This question is required. Please select or fill in an option.');
      return;
    }

    setValidationError(null);
    if (currentIndex < steps.length - 1) {
      setDirection('forward');
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed, navigate to Review
      navigate('/review');
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    if (currentIndex > 0) {
      setDirection('backward');
      setCurrentIndex((prev) => prev - 1);
    } else {
      navigate('/choose-method');
    }
  };

  const handleSkip = () => {
    if (currentStep.skipEnabled) {
      updateField(currentStep.id as keyof FitProfile, 'Skipped');
      setValidationError(null);
      if (currentIndex < steps.length - 1) {
        setDirection('forward');
        setCurrentIndex((prev) => prev + 1);
      } else {
        navigate('/review');
      }
    }
  };

  // Rendering individual input types
  const renderInput = () => {
    switch (currentStep.type) {
      case 'select': {
        const val = fitProfile[currentStep.id as keyof FitProfile] as string;
        return (
          <div className="space-y-3" id={`quiz-select-${currentStep.id}`}>
            <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Select Measurement
            </label>
            <select
              value={val}
              onChange={(e) => updateField(currentStep.id as keyof FitProfile, e.target.value)}
              className="w-full rounded-2xl border border-editorial-border bg-white p-4 font-sans text-base text-editorial-text shadow-sm focus:border-denim-700 focus:outline-none transition-colors"
              id={`select-field-${currentStep.id}`}
            >
              <option value="">Choose an option...</option>
              {currentStep.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} {currentStep.id === 'waist' || currentStep.id === 'hips' ? 'inches' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case 'number': {
        const val = fitProfile[currentStep.id as keyof FitProfile] as string;
        const numericVal = val === 'Skipped' ? '' : val;
        return (
          <div className="space-y-3" id={`quiz-number-${currentStep.id}`}>
            <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              Weight (lbs)
            </label>
            <input
              type="number"
              value={numericVal}
              onChange={(e) => updateField(currentStep.id as keyof FitProfile, e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full rounded-2xl border border-editorial-border bg-white p-4 font-sans text-base text-editorial-text shadow-sm focus:border-denim-700 focus:outline-none transition-colors"
              id={`input-field-${currentStep.id}`}
              min="50"
              max="500"
            />
            <p className="text-xs text-gray-400 font-sans italic">
              Weight is used to accurately estimate overall frame volume.
            </p>
          </div>
        );
      }

      case 'radio': {
        const val = fitProfile[currentStep.id as keyof FitProfile] as string;
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" id={`quiz-radio-${currentStep.id}`}>
            {currentStep.options?.map((opt) => {
              const isSelected = val === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateField(currentStep.id as keyof FitProfile, opt)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left font-sans transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-denim-700 bg-denim-50/50 text-editorial-text font-semibold'
                      : 'border-editorial-border bg-white text-gray-700 hover:border-gray-400'
                  }`}
                  style={{ minHeight: '52px' }}
                  id={`radio-option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span className="text-sm">{opt}</span>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-denim-700 bg-denim-700' : 'border-gray-200'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        );
      }

      case 'checkbox': {
        const val = (fitProfile[currentStep.id as keyof FitProfile] as string[]) || [];
        return (
          <div className="space-y-4" id={`quiz-checkbox-${currentStep.id}`}>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Select at least one brand that you wear:</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 max-h-72 overflow-y-auto p-1.5 border border-editorial-border rounded-2xl bg-warm-muted">
              {currentStep.options?.map((opt) => {
                const isSelected = val.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const nextVal = isSelected ? val.filter((v) => v !== opt) : [...val, opt];
                      updateField(currentStep.id as keyof FitProfile, nextVal);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left font-sans text-xs transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-denim-700 bg-white text-editorial-text font-semibold shadow-sm'
                        : 'border-editorial-border bg-white text-gray-600 hover:border-gray-350'
                    }`}
                    style={{ minHeight: '44px' }}
                    id={`checkbox-option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div
                      className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-denim-700 bg-denim-700 text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                           <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'brand-size': {
        const brand = currentStep.brandName!;
        const val = fitProfile.brandSizes[brand] || '';
        return (
          <div className="space-y-4" id={`quiz-brand-size-${brand}`}>
            <div className="flex items-center gap-3 bg-white border border-editorial-border rounded-2xl p-4 mb-4 shadow-sm">
              <div className="bg-denim-700 text-white text-xs font-bold rounded-xl h-9 w-9 flex items-center justify-center shrink-0 shadow-sm font-display">
                {brand[0]}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-editorial-text font-display">{brand} Sizing</h4>
                <p className="text-[11px] text-gray-500 font-light">Helps us calibrate size variances between brands.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Select Sizing (Inches)
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {currentStep.options?.map((opt) => {
                  const isSelected = val === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateBrandSize(brand, opt)}
                      className={`flex h-12 items-center justify-center rounded-xl border text-sm font-sans transition-all cursor-pointer ${
                        isSelected
                          ? 'border-denim-700 bg-denim-700 text-white font-bold shadow-sm'
                          : 'border-editorial-border bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      style={{ minHeight: '44px' }}
                      id={`size-opt-${brand}-${opt}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Framer Motion animation values for slide effect
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-16" id="manual-quiz-container">
      {/* Top Progress bar section */}
      <div className="mb-8">
        <ProgressBar
          currentStep={currentIndex + 1}
          totalSteps={steps.length}
          label={getStepHeaderLabel()}
        />
      </div>

      {/* Main Card View */}
      <div className="min-h-[420px] rounded-3xl border border-editorial-border bg-white p-6 sm:p-8 shadow-sm relative flex flex-col justify-between overflow-hidden">
        
        {/* Animated Question Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col justify-between flex-1"
          >
            <div>
              {/* Question Text */}
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-editorial-text tracking-tight leading-snug mb-6">
                {currentStep.questionText}
              </h3>

              {/* Render dynamic inputs */}
              {renderInput()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Validation Error Block */}
        {validationError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-700" id="quiz-error-alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">{validationError}</span>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-editorial-border pt-6">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 rounded-full border border-editorial-border px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white transition-colors hover:bg-warm-muted cursor-pointer"
            style={{ minHeight: '44px' }}
            id="quiz-back-button"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex gap-2">
            {currentStep.skipEnabled && (
              <button
                onClick={handleSkip}
                className="rounded-full px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                style={{ minHeight: '44px' }}
                id="quiz-skip-button"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex items-center gap-1.5 rounded-full px-6 py-3 text-xs font-bold tracking-widest uppercase text-white transition-all cursor-pointer ${
                isStepValid()
                  ? 'bg-denim-700 hover:bg-denim-800 active:scale-98'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              style={{ minHeight: '44px' }}
              id="quiz-next-button"
            >
              <span>{currentIndex === steps.length - 1 ? 'Review' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
