/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, HelpCircle, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import VoiceWaveform from '../components/VoiceWaveform';
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
import {
  parseHeight,
  parseWeight,
  parseWaist,
  parseHips,
  parseWaistPreference,
  parseWaistbandPosition,
  parseThighFit,
  parseBrands,
  parseBrandSize,
  parseFrustration,
} from '../utils/voiceParser';

export default function VoiceOnboarding() {
  const navigate = useNavigate();
  const { fitProfile, updateField, updateBrandSize, resetProfile } = useOnboarding();

  // TTS & STT hooks
  const { isSupported: ttsSupported, isSpeaking, speak, stop: stopTTS } = useTextToSpeech();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'speaking' | 'listening' | 'confirming' | 'error'>('idle');

  const onResult = (text: string, isFinal: boolean) => {
    setLiveTranscript(text);
    if (isFinal) {
      handleUserAnswer(text);
    }
  };

  const {
    isSupported: sttSupported,
    isListening,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onResult,
    onError: (err) => {
      setVoiceError(err);
      setState('error');
    },
  });

  const isVoiceSupported = ttsSupported && sttSupported;

  // Compute conversational steps dynamically based on selected brands
  const steps = React.useMemo(() => {
    const baseSteps: any[] = [
      {
        id: 'height',
        field: 'height',
        type: 'select',
        questionText: 'What is your height?',
        speechText: "Welcome to Jackie Jeans. Let's find your perfect fit. First, what is your height? For example, you can say five foot six.",
        options: HEIGHT_OPTIONS,
        parser: parseHeight,
        confirmPrefix: "Great! I've recorded your height as ",
      },
      {
        id: 'weight',
        field: 'weight',
        type: 'number',
        questionText: 'What is your weight? (Optional)',
        speechText: "Got it. Next, what is your weight in pounds? Or say skip if you'd prefer to keep it private.",
        parser: parseWeight,
        confirmPrefix: "Perfect. Weight set as ",
      },
      {
        id: 'waist',
        field: 'waist',
        type: 'select',
        questionText: 'What is your waist measurement?',
        speechText: "Awesome. What is your waist measurement in inches? Typically between twenty-four and fifty-two.",
        options: WAIST_OPTIONS,
        parser: parseWaist,
        confirmPrefix: "Got it. Your waist measurement is ",
      },
      {
        id: 'hips',
        field: 'hips',
        type: 'select',
        questionText: 'What is your hip measurement?',
        speechText: "Recorded. And what is your hip measurement in inches? Usually between thirty-two and sixty.",
        options: HIP_OPTIONS,
        parser: parseHips,
        confirmPrefix: "Understood. Your hip measurement is ",
      },
      {
        id: 'waistPreference',
        field: 'waistPreference',
        type: 'radio',
        questionText: 'How do you prefer your jeans to fit around your waist?',
        speechText: "Excellent. How do you prefer your jeans to fit around your waist? Snug, slightly relaxed, or relaxed?",
        options: WAIST_PREF_OPTIONS,
        parser: parseWaistPreference,
        confirmPrefix: "Lovely! Preference set to ",
      },
      {
        id: 'waistbandPosition',
        field: 'waistbandPosition',
        type: 'radio',
        questionText: 'Where do you prefer your waistband to sit?',
        speechText: "Got it. Where do you prefer your waistband to sit? High rise, mid rise, or low rise?",
        options: WAISTBAND_POSITION_OPTIONS,
        parser: parseWaistbandPosition,
        confirmPrefix: "Noted. Waistband position set to ",
      },
      {
        id: 'thighFit',
        field: 'thighFit',
        type: 'radio',
        questionText: 'What is your preferred thigh fit?',
        speechText: "Perfect. What is your preferred thigh fit? Fitted, relaxed, or loose?",
        options: THIGH_FIT_OPTIONS,
        parser: parseThighFit,
        confirmPrefix: "Understood. Thigh fit set to ",
      },
      {
        id: 'brands',
        field: 'brands',
        type: 'checkbox',
        questionText: 'Which brands have you purchased in the past?',
        speechText: "We're almost there! Which brands have you purchased in the past? You can list multiple brands, like Levi's, Wrangler, Gap, Zara, or H&M.",
        options: BRAND_OPTIONS,
        parser: parseBrands,
        confirmPrefix: "Great! Selected brands: ",
      },
    ];

    // Dynamic brand size steps
    fitProfile.brands.forEach((brand) => {
      baseSteps.push({
        id: `brand-size-${brand}`,
        field: 'brandSizes',
        brandName: brand,
        type: 'brand-size',
        questionText: `What size do you usually wear in ${brand}?`,
        speechText: `What size do you usually wear in ${brand}? For example, twenty-eight, thirty, or thirty-two.`,
        options: SIZE_OPTIONS,
        parser: parseBrandSize,
        confirmPrefix: `Got it. Your size in ${brand} is `,
      });
    });

    // Frustration Step
    baseSteps.push({
      id: 'frustration',
      field: 'frustration',
      type: 'radio',
      questionText: 'What is your biggest fit frustration when buying jeans?',
      speechText: "Finally, what is your biggest fit frustration when buying jeans? Is it waist gap, hip tightness, wrong length, thigh fit, rise, or other?",
      options: FRUSTRATION_OPTIONS,
      parser: parseFrustration,
      confirmPrefix: "Thank you. Frustration recorded as ",
    });

    return baseSteps;
  }, [fitProfile.brands]);

  const currentStep = steps[activeStepIndex];

  // Speak the active question
  const askQuestion = (stepIdx: number, textToSpeak?: string) => {
    if (!isVoiceSupported) return;

    setState('speaking');
    setLiveTranscript('');
    const targetText = textToSpeak || steps[stepIdx].speechText;

    speak(targetText, () => {
      // Once TTS ends, start listening
      setState('listening');
      startListening();
    });
  };

  // Start the voice onboarding session
  const handleStartVoice = () => {
    setHasStarted(true);
    askQuestion(0);
  };

  // Handle user's parsed spoken answer
  const handleUserAnswer = (spokenText: string) => {
    if (!spokenText) return;

    const parsedValue = currentStep.parser(spokenText);
    // Handle "all brands"
if (
  currentStep.id === "brands" &&
  ["all", "all brands", "all of the above", "everything", "every brand"].includes(
    spokenText.toLowerCase().trim()
  )
) {
  updateField("brands", BRAND_OPTIONS);
  speak("Perfect! I've selected all brands.", () => {
    setActiveStepIndex((prev) => prev + 1);
  });
  return;
}
// Handle "none"
if (
  currentStep.id === "brands" &&
  ["none", "no", "no brands", "haven't bought any"].includes(
    spokenText.toLowerCase().trim()
  )
) {
  updateField("brands", []);
  speak("No problem. We'll skip the brand questions.", () => {
    setActiveStepIndex((prev) => prev + 1);
  });
  return;
}

    if (parsedValue !== null) {
      // Valid response parsed!
      setVoiceError(null);
      setState('confirming');
      stopListening();

      // Update fitProfile state
      if (currentStep.type === 'brand-size') {
        updateBrandSize(currentStep.brandName, parsedValue);
      } else {
        updateField(currentStep.field as keyof FitProfile, parsedValue);
      }

      // Voice Confirmation before advancing
      const displayValue = Array.isArray(parsedValue) ? parsedValue.join(', ') : parsedValue;
      const confirmSpeech = `${currentStep.confirmPrefix} ${displayValue}. Moving on.`;

      speak(confirmSpeech, () => {
        // Advance or Navigate to review
        if (activeStepIndex < steps.length - 1) {
          setActiveStepIndex((prev) => prev + 1);
        } else {
          navigate('/review');
        }
      });
    } else {
  setState("speaking");

  const reprompt =
    "Sorry, I didn't quite catch that. Take your time. I'll repeat the question. " +
    currentStep.questionText;

  speak(reprompt, () => {
    setState("listening");
    startListening();
  });
}
  };

  // Trigger asking the question whenever the active index changes (if session started)
  useEffect(() => {
    if (hasStarted && isVoiceSupported) {
      askQuestion(activeStepIndex);
    }
    return () => {
      stopTTS();
      stopListening();
    };
  }, [activeStepIndex, hasStarted]);

  // Handle hybrid manual fallback selections
  const handleManualSelect = (value: any) => {
    stopTTS();
    stopListening();
    setVoiceError(null);

    if (currentStep.type === 'brand-size') {
      updateBrandSize(currentStep.brandName, value);
    } else if (currentStep.type === 'checkbox') {
      // Toggle for brand lists
      const currentVal = (fitProfile.brands || []) as string[];
      const nextVal = currentVal.includes(value)
        ? currentVal.filter((v) => v !== value)
        : [...currentVal, value];
      updateField('brands', nextVal);
      return; // Stay on screen to let them click multiple
    } else {
      updateField(currentStep.field as keyof FitProfile, value);
    }

    // Auto-advance manual click
    if (currentStep.type !== 'checkbox') {
      handleAdvanceNext();
    }
  };

  const handleAdvanceNext = () => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      navigate('/review');
    }
  };

  const handleManualSkip = () => {
    if (currentStep.id === 'weight') {
      updateField('weight', 'Skipped');
      handleAdvanceNext();
    }
  };

  const handleReRecord = () => {
    stopTTS();
    stopListening();
    setVoiceError(null);
    askQuestion(activeStepIndex);
  };

  // Fallback view when browser APIs are missing (e.g. some web views / iframes / mobile browsers)
  if (!isVoiceSupported) {
    return (
      <div className="mx-auto max-w-md px-4 py-12" id="voice-unavailable-view">
        <div className="rounded-3xl border border-editorial-border bg-white p-8 text-center shadow-sm">
          <HelpCircle className="mx-auto h-12 w-12 text-denim-700 animate-pulse mb-4" />
          <h3 className="font-serif text-xl font-bold text-editorial-text mb-2">Voice Onboarding Unavailable</h3>
          <p className="text-sm text-gray-500 leading-relaxed font-sans font-light mb-6">
            Your browser or iframe preview does not support Speech Recognition or Text-To-Speech APIs. No worries! You can complete our beautiful Smart Fit Quiz manually.
          </p>
          <button
            onClick={() => navigate('/manual-quiz')}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-denim-700 py-3 text-xs font-bold tracking-widest uppercase text-white shadow-sm hover:bg-denim-800 transition-colors cursor-pointer"
            style={{ minHeight: '44px' }}
            id="redirect-manual-quiz"
          >
            <span>Start Manual Quiz</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-16" id="voice-onboarding-container">
      {/* Top Progress bar */}
      {hasStarted && (
        <div className="mb-6">
          <ProgressBar
            currentStep={activeStepIndex + 1}
            totalSteps={steps.length}
            label={currentStep.type === 'brand-size' ? `Brand Sizing: ${currentStep.brandName}` : `Jackie Voice Assistant`}
          />
        </div>
      )}

      {!hasStarted ? (
        /* Welcome Overlay to initiate sound activation */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-editorial-border bg-white p-8 text-center shadow-sm flex flex-col items-center"
          id="voice-start-card"
        >
          <div className="h-16 w-16 bg-denim-50 border border-editorial-border/40 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Mic className="h-8 w-8 text-denim-700 animate-pulse" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-editorial-text mb-3">
            Talk with Jackie AI
          </h3>
          
          <p className="text-sm text-gray-400 font-sans font-light leading-relaxed mb-8 max-w-xs">
            Jackie will speak to you and listen to your sizing preferences hands-free. Please ensure your device volume is up and microphone permission is enabled.
          </p>

          <button
            onClick={handleStartVoice}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-denim-700 py-4 text-xs font-bold tracking-widest uppercase text-white shadow-sm hover:bg-denim-800 transition-all duration-300 cursor-pointer"
            style={{ minHeight: '48px' }}
            id="start-voice-session"
          >
            <Sparkles className="h-4 w-4" />
            <span>Enable Voice & Start</span>
          </button>
        </motion.div>
      ) : (
        /* Active voice conversation interface */
        <div className="space-y-6">
          
          {/* Pulsing Visual Waveform */}
          <VoiceWaveform
            state={state === 'speaking' ? 'speaking' : isListening ? 'listening' : state === 'error' ? 'error' : 'idle'}
            errorMessage={voiceError}
          />

          {/* Transcript Panel */}
          <div className="rounded-2xl border border-editorial-border bg-warm-muted p-4 shadow-sm min-h-[90px] flex flex-col justify-between" id="voice-transcript-panel">
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 font-display mb-1.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Transcript</span>
            </div>
            <p className="text-sm text-editorial-text font-sans italic leading-relaxed min-h-[30px]">
              {liveTranscript || '"Listening to your response..."'}
            </p>
          </div>

          {/* Hybrid Manual Fallback Question Card */}
          <div className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm" id="hybrid-question-card">
            <div className="flex justify-between items-center mb-4 border-b border-editorial-border pb-3">
              <h4 className="font-serif text-lg font-semibold text-editorial-text leading-snug">
                {currentStep.questionText}
              </h4>
              <button
                onClick={handleReRecord}
                className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-denim-700 bg-denim-50 hover:bg-denim-100/60 border border-editorial-border px-2.5 py-1.5 rounded-full shrink-0 uppercase cursor-pointer"
                id="voice-re-record-btn"
                title="Tap to listen and record again"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Repeat</span>
              </button>
            </div>

            {/* Render hybrid interactive fallback option panels */}
            <div className="mt-3 max-h-52 overflow-y-auto p-1">
              {currentStep.type === 'select' && (
                <div className="grid grid-cols-3 gap-2">
                  {currentStep.options?.map((opt: string) => {
                    const isSel = fitProfile[currentStep.field as keyof FitProfile] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleManualSelect(opt)}
                        className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                          isSel ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text' : 'border-editorial-border hover:border-gray-400 bg-white'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep.type === 'number' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Type weight (lbs)"
                    className="flex-1 rounded-xl border border-editorial-border bg-white p-3 text-sm focus:border-denim-700 focus:outline-none text-editorial-text"
                    onChange={(e) => updateField('weight', e.target.value)}
                    value={fitProfile.weight === 'Skipped' ? '' : fitProfile.weight}
                  />
                  {currentStep.id === 'weight' && (
                    <button
                      onClick={handleManualSkip}
                      className="px-4 py-3 bg-warm-muted border border-editorial-border hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                      style={{ minHeight: '44px' }}
                    >
                      Skip
                    </button>
                  )}
                  <button
                    onClick={() => handleManualSelect(fitProfile.weight)}
                    className="bg-denim-700 text-white rounded-xl text-xs font-bold tracking-widest uppercase px-4 py-3 cursor-pointer"
                    style={{ minHeight: '44px' }}
                  >
                    Confirm
                  </button>
                </div>
              )}

              {currentStep.type === 'radio' && (
                <div className="space-y-1.5">
                  {currentStep.options?.map((opt: string) => {
                    const isSel = fitProfile[currentStep.field as keyof FitProfile] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleManualSelect(opt)}
                        className={`w-full text-left py-2.5 px-4 text-xs rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                          isSel ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text' : 'border-editorial-border hover:border-gray-400 bg-white'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <span>{opt}</span>
                        {isSel && <CheckCircle2 className="h-4 w-4 text-denim-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep.type === 'checkbox' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 max-h-36 overflow-y-auto">
                    {BRAND_OPTIONS.map((opt: string) => {
                      const isSel = (fitProfile.brands || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => handleManualSelect(opt)}
                          className={`py-2 px-2.5 text-[10px] text-left truncate rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSel ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text' : 'border-editorial-border hover:border-gray-400 bg-white'
                          }`}
                          style={{ minHeight: '40px' }}
                        >
                          <div className={`h-3.5 w-3.5 border rounded flex items-center justify-center shrink-0 ${isSel ? 'bg-denim-700 text-white border-denim-700' : 'border-gray-300 bg-white'}`}>
                            {isSel && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={(fitProfile.brands || []).length === 0}
                    onClick={handleAdvanceNext}
                    className={`w-full py-2.5 text-xs font-bold rounded-full tracking-widest uppercase text-white cursor-pointer ${
                      (fitProfile.brands || []).length > 0 ? 'bg-denim-700 hover:bg-denim-800' : 'bg-gray-200 cursor-not-allowed'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    Confirm Brands
                  </button>
                </div>
              )}

              {currentStep.type === 'brand-size' && (
                <div className="grid grid-cols-3 gap-2">
                  {currentStep.options?.map((opt: string) => {
                    const isSel = fitProfile.brandSizes[currentStep.brandName!] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleManualSelect(opt)}
                        className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                          isSel ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text' : 'border-editorial-border hover:border-gray-400 bg-white'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step back/skip buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-editorial-border">
              <button
                onClick={() => {
                  if (activeStepIndex > 0) {
                    setActiveStepIndex((prev) => prev - 1);
                  } else {
                    navigate('/choose-method');
                  }
                }}
                className="text-xs text-gray-400 hover:text-editorial-text font-bold uppercase tracking-widest cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Previous Step
              </button>
              <span className="text-[10px] text-gray-300 font-mono">
                Step {activeStepIndex + 1} of {steps.length}
              </span>
              <button
                onClick={() => navigate('/choose-method')}
                className="text-xs text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Exit Voice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
