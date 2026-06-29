/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Volume2,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
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

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

/**
 * Conversation states:
 *
 *  IDLE ──▶ SPEAKING ──▶ WAITING ──▶ LISTENING ──▶ PROCESSING
 *                                                        │
 *                              ┌── valid ────────────────▼──────────────────┐
 *                              │                  CONFIRMING                 │
 *                              │  (speak confirmation, then advance step)    │
 *                              └─────────────────────────────────────────────┘
 *                                        │── invalid ──▶ SPEAKING (reprompt)
 */
type ConvState =
  | 'idle'
  | 'speaking'    // TTS is playing the question
  | 'waiting'     // short guard delay after TTS ends, before mic opens
  | 'listening'   // mic is open, waiting for user speech
  | 'processing'  // we received a final transcript, parsing it
  | 'confirming'  // speaking the confirmation phrase
  | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** ms to wait after TTS finishes before opening the mic */
const PRE_LISTEN_DELAY_MS = 900;

/** ms to wait after confirmation finishes before advancing to next question */
const POST_CONFIRM_DELAY_MS = 600;

/** How many reprompt attempts before giving up and showing the manual panel */
const MAX_REPROMPT_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceOnboarding() {
  const navigate = useNavigate();
  const { fitProfile, updateField, updateBrandSize } = useOnboarding();

  // ── TTS ──────────────────────────────────────────────────────────────────
  const { isSupported: ttsSupported, isSpeaking, speak, stop: stopTTS } = useTextToSpeech();

  // ── State machine ─────────────────────────────────────────────────────────
  const [convState, setConvState] = useState<ConvState>('idle');
  const convStateRef = useRef<ConvState>('idle');
  const setConvStateSynced = useCallback((s: ConvState) => {
    convStateRef.current = s;
    setConvState(s);
  }, []);

  // ── Quiz navigation ───────────────────────────────────────────────────────
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // ── UI feedback ───────────────────────────────────────────────────────────
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [repromptCount, setRepromptCount] = useState(0);

  // Guard: prevents stale-closure callbacks from triggering state transitions
  // after the step has already advanced.
  const stepEpochRef = useRef(0);

  // Pending action after TTS finishes (used inside SPEAKING/CONFIRMING)
  const pendingAfterSpeakRef = useRef<(() => void) | null>(null);

  // ── Steps ─────────────────────────────────────────────────────────────────
  const steps = useMemo(() => {
    const baseSteps: any[] = [
      {
        id: 'height',
        field: 'height',
        type: 'select',
        questionText: 'What is your height?',
        speechText:
          "Hi! I'm Jackie, your personal denim stylist. I'll ask you a few quick questions to build your perfect fit profile. Please wait until I finish speaking before you answer. First, what's your height? For example, you can say five foot six.",
        options: HEIGHT_OPTIONS,
        parser: parseHeight,
        confirmPrefix: "Great! I've noted your height as",
      },
      {
        id: 'weight',
        field: 'weight',
        type: 'number',
        questionText: 'What is your weight? (Optional)',
        speechText:
          "Got it. Next, what is your weight in pounds? Or say skip if you'd prefer to keep that private.",
        parser: parseWeight,
        confirmPrefix: 'Perfect. Weight recorded as',
      },
      {
        id: 'waist',
        field: 'waist',
        type: 'select',
        questionText: 'What is your waist measurement?',
        speechText:
          'What is your waist measurement in inches? It is usually somewhere between twenty-four and fifty-two.',
        options: WAIST_OPTIONS,
        parser: parseWaist,
        confirmPrefix: 'Got it. Waist measurement is',
      },
      {
        id: 'hips',
        field: 'hips',
        type: 'select',
        questionText: 'What is your hip measurement?',
        speechText:
          'And what is your hip measurement in inches? Usually between thirty-two and sixty.',
        options: HIP_OPTIONS,
        parser: parseHips,
        confirmPrefix: 'Recorded. Hip measurement is',
      },
      {
        id: 'waistPreference',
        field: 'waistPreference',
        type: 'radio',
        questionText: 'How do you prefer your jeans to fit around your waist?',
        speechText:
          'How do you prefer your jeans to fit around your waist? Your options are snug, slightly relaxed, or relaxed.',
        options: WAIST_PREF_OPTIONS,
        parser: parseWaistPreference,
        confirmPrefix: 'Lovely! Waist preference set to',
      },
      {
        id: 'waistbandPosition',
        field: 'waistbandPosition',
        type: 'radio',
        questionText: 'Where do you prefer your waistband to sit?',
        speechText:
          'Where do you prefer your waistband to sit? High rise, mid rise, or low rise?',
        options: WAISTBAND_POSITION_OPTIONS,
        parser: parseWaistbandPosition,
        confirmPrefix: 'Noted. Waistband position is',
      },
      {
        id: 'thighFit',
        field: 'thighFit',
        type: 'radio',
        questionText: 'What is your preferred thigh fit?',
        speechText:
          'What is your preferred thigh fit? Fitted, relaxed, or loose?',
        options: THIGH_FIT_OPTIONS,
        parser: parseThighFit,
        confirmPrefix: 'Understood. Thigh fit set to',
      },
      {
        id: 'brands',
        field: 'brands',
        type: 'checkbox',
        questionText: 'Which brands have you purchased in the past?',
        speechText:
          "Almost there! Which denim brands have you purchased before? You can name multiple, like Levi's, Wrangler, Gap, Zara, or H and M. Say all brands to select everything, or none if you haven't bought any.",
        options: BRAND_OPTIONS,
        parser: parseBrands,
        confirmPrefix: 'Great! Selected brands:',
      },
    ];

    // Dynamic brand-size steps
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
        confirmPrefix: `Your size in ${brand} is`,
      });
    });

    baseSteps.push({
      id: 'frustration',
      field: 'frustration',
      type: 'radio',
      questionText: 'What is your biggest fit frustration when buying jeans?',
      speechText:
        'Last question! What is your biggest fit frustration when buying jeans? Is it waist gap, hip tightness, wrong length, thigh fit, rise, or other?',
      options: FRUSTRATION_OPTIONS,
      parser: parseFrustration,
      confirmPrefix: 'Thank you. Frustration noted as',
    });

    return baseSteps;
  }, [fitProfile.brands]);

  const currentStep = steps[activeStepIndex];

  // ── STT ───────────────────────────────────────────────────────────────────

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      // Only act if we are actually in the LISTENING state
      if (convStateRef.current !== 'listening') return;

      setLiveTranscript(transcript);
      setConvStateSynced('processing');

      const epoch = stepEpochRef.current;

      // Defer processing slightly so React state settles
      setTimeout(() => {
        if (stepEpochRef.current !== epoch) return;
        processTranscript(transcript);
      }, 80);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStepIndex, steps]
  );

  const handleSttEnd = useCallback(() => {
    // Recognition ended without a final result (silence / no-speech)
    if (convStateRef.current !== 'listening') return;
    // Re-open the mic silently; don't reprompt — just listen again once
    setConvStateSynced('waiting');
    setTimeout(() => {
      if (convStateRef.current === 'waiting') {
        setConvStateSynced('listening');
        startListening();
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSttError = useCallback((err: string) => {
    if (convStateRef.current === 'idle') return;
    setVoiceError(err);
    setConvStateSynced('error');
  }, []);

  const { isSupported: sttSupported, isListening, interimTranscript, startListening, stopListening } =
    useVoiceRecognition({
      onFinalResult: handleFinalTranscript,
      onEnd: handleSttEnd,
      onError: handleSttError,
    });

  // Show interim transcript while user speaks
  useEffect(() => {
    if (interimTranscript) setLiveTranscript(interimTranscript);
  }, [interimTranscript]);

  const isVoiceSupported = ttsSupported && sttSupported;

  // ── Core helpers ──────────────────────────────────────────────────────────

  /**
   * Begin the SPEAKING → WAITING → LISTENING sequence for the given text.
   * `epoch` lets us discard callbacks that belong to a previous step.
   */
  const speakThenListen = useCallback(
    (text: string, epoch: number) => {
      stopListening();
      setConvStateSynced('speaking');
      setLiveTranscript('');

      speak(text, () => {
        if (stepEpochRef.current !== epoch) return;
        setConvStateSynced('waiting');
        setTimeout(() => {
          if (stepEpochRef.current !== epoch) return;
          if (convStateRef.current !== 'waiting') return;
          setConvStateSynced('listening');
          startListening();
        }, PRE_LISTEN_DELAY_MS);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** Ask the current question from scratch */
  const askQuestion = useCallback(
    (stepIdx: number) => {
      if (!isVoiceSupported) return;
      const epoch = ++stepEpochRef.current;
      setRepromptCount(0);
      setVoiceError(null);
      speakThenListen(steps[stepIdx].speechText, epoch);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVoiceSupported, steps]
  );

  /** Reprompt with a shorter reminder (after a failed parse) */
  const repromptQuestion = useCallback(
    (stepIdx: number, attempt: number) => {
      const epoch = stepEpochRef.current; // keep same epoch
      const step = steps[stepIdx];
      const repromptText =
        attempt === 1
          ? `I didn't quite catch that. ${step.speechText}`
          : `Let me repeat. ${step.questionText}`;
      speakThenListen(repromptText, epoch);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps]
  );

  /**
   * Parse the user's transcript for the current step,
   * confirm if valid, reprompt if not.
   */
  const processTranscript = useCallback(
    (transcript: string) => {
      const step = steps[activeStepIndex];
      const epoch = stepEpochRef.current;

      const parsedValue = step.parser(transcript);
      console.log("Transcript:", transcript);
console.log("Parsed Value:", parsedValue);
console.log("Current Step:", currentStep.id);

      if (parsedValue === null) {
        // Could not parse — reprompt
        const nextAttempt = repromptCount + 1;
        setRepromptCount(nextAttempt);

        if (nextAttempt >= MAX_REPROMPT_ATTEMPTS) {
          // Give up on voice for this question; surface the manual panel
          setVoiceError(
            "I'm having trouble understanding. Please use the panel below to select your answer."
          );
          setConvStateSynced('error');
          return;
        }

        repromptQuestion(activeStepIndex, nextAttempt);
        return;
      }

      // ── Valid answer ──
      setVoiceError(null);
      stopListening();

      // Commit the value to context
      if (step.type === 'brand-size') {
        updateBrandSize(step.brandName, parsedValue);
      } else {
        updateField(step.field as keyof FitProfile, parsedValue);
      }

      // Build a natural confirmation phrase
      const displayValue = Array.isArray(parsedValue)
        ? parsedValue.length === 0
          ? 'none'
          : parsedValue.join(', ')
        : String(parsedValue);

      const confirmText =
        parsedValue === 'Skipped'
          ? "No problem, we'll keep that private."
          : `${step.confirmPrefix} ${displayValue}.`;

      setConvStateSynced('confirming');

      speak(confirmText, () => {
  setTimeout(() => {
    setActiveStepIndex((prev) => prev + 1);
  }, 500);
});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStepIndex, steps, repromptCount]
  );

  /** Move to the next step or navigate to review */
  const advanceStep = useCallback(() => {
    setActiveStepIndex((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        navigate('/review');
        return prev;
      }
      return next;
    });
  }, [steps.length, navigate]);

  // ── Trigger question when active step changes ─────────────────────────────

  useEffect(() => {
    if (!hasStarted || !isVoiceSupported) return;

    // Bump epoch so any in-flight callbacks from previous step are ignored
    stepEpochRef.current += 1;

    // Small delay so React can flush state before we start speaking
    const timer = setTimeout(() => {
      askQuestion(activeStepIndex);
    }, 300);

    return () => {
      clearTimeout(timer);
      // Do NOT stop TTS/STT here — askQuestion handles that cleanly
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStepIndex, hasStarted]);

  // ── Start session ─────────────────────────────────────────────────────────

  const handleStartVoice = useCallback(() => {
    setHasStarted(true);
    // useEffect above will fire because hasStarted changes, but we need
    // to also call for step 0 explicitly since activeStepIndex won't change.
    setTimeout(() => {
      askQuestion(0);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual fallback handlers ───────────────────────────────────────────────

  const handleManualSelect = (value: any) => {
    stopTTS();
    stopListening();
    stepEpochRef.current += 1; // invalidate any pending voice callbacks
    setVoiceError(null);

    if (currentStep.type === 'brand-size') {
      updateBrandSize(currentStep.brandName, value);
    } else if (currentStep.type === 'checkbox') {
      const currentVal = (fitProfile.brands || []) as string[];
      const nextVal = currentVal.includes(value)
        ? currentVal.filter((v: string) => v !== value)
        : [...currentVal, value];
      updateField('brands', nextVal);
      return; // stay on page; let user select multiple
    } else {
      updateField(currentStep.field as keyof FitProfile, value);
    }

    if (currentStep.type !== 'checkbox') {
      handleAdvanceNext();
    }
  };

  const handleAdvanceNext = useCallback(() => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      navigate('/review');
    }
  }, [activeStepIndex, steps.length, navigate]);

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
    setRepromptCount(0);
    askQuestion(activeStepIndex);
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const waveformState: 'speaking' | 'listening' | 'error' | 'idle' =
    convState === 'speaking' || convState === 'confirming'
      ? 'speaking'
      : convState === 'listening'
      ? 'listening'
      : convState === 'error'
      ? 'error'
      : 'idle';

  const statusLabel: string = {
    idle: 'Ready',
    speaking: 'Jackie is speaking…',
    waiting: 'Almost ready…',
    listening: 'Listening…',
    processing: 'Processing…',
    confirming: 'Confirming…',
    error: 'Needs attention',
  }[convState];

  // ── Unsupported browser ────────────────────────────────────────────────────

  if (!isVoiceSupported) {
    return (
      <div className="mx-auto max-w-md px-4 py-12" id="voice-unavailable-view">
        <div className="rounded-3xl border border-editorial-border bg-white p-8 text-center shadow-sm">
          <HelpCircle className="mx-auto h-12 w-12 text-denim-700 animate-pulse mb-4" />
          <h3 className="font-serif text-xl font-bold text-editorial-text mb-2">
            Voice Onboarding Unavailable
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed font-sans font-light mb-6">
            Your browser does not support Speech Recognition or Text-To-Speech APIs. No worries —
            you can complete the Smart Fit Quiz manually.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-16" id="voice-onboarding-container">
      {/* Progress bar */}
      {hasStarted && (
        <div className="mb-6">
          <ProgressBar
            currentStep={activeStepIndex + 1}
            totalSteps={steps.length}
            label={
              currentStep.type === 'brand-size'
                ? `Brand Sizing: ${currentStep.brandName}`
                : 'Jackie Voice Assistant'
            }
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!hasStarted ? (
          /* ── Welcome card ─────────────────────────────────────────────── */
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
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
              Jackie will speak to you and listen to your sizing preferences hands-free. Please
              ensure your device volume is up and microphone permission is enabled.
            </p>

            <button
              onClick={handleStartVoice}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-denim-700 py-4 text-xs font-bold tracking-widest uppercase text-white shadow-sm hover:bg-denim-800 transition-all duration-300 cursor-pointer"
              style={{ minHeight: '48px' }}
              id="start-voice-session"
            >
              <Sparkles className="h-4 w-4" />
              <span>Enable Voice &amp; Start</span>
            </button>
          </motion.div>
        ) : (
          /* ── Active voice interface ───────────────────────────────────── */
          <motion.div
            key={`step-${activeStepIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Waveform */}
            <VoiceWaveform
              state={waveformState}
              errorMessage={voiceError}
            />

            {/* Status badge */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase border ${
                  convState === 'listening'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : convState === 'speaking' || convState === 'confirming'
                    ? 'bg-denim-50 border-denim-200 text-denim-700'
                    : convState === 'error'
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-warm-muted border-editorial-border text-gray-400'
                }`}
              >
                {convState === 'listening' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                )}
                {(convState === 'speaking' || convState === 'confirming') && (
                  <Volume2 className="h-3 w-3" />
                )}
                {statusLabel}
              </span>
            </div>

            {/* Live transcript */}
            <div
              className="rounded-2xl border border-editorial-border bg-warm-muted p-4 shadow-sm min-h-[90px] flex flex-col justify-between"
              id="voice-transcript-panel"
            >
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 font-display mb-1.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Transcript</span>
              </div>
              <p className="text-sm text-editorial-text font-sans italic leading-relaxed min-h-[30px]">
                {liveTranscript || '"Listening to your response…"'}
              </p>
            </div>

            {/* Hybrid manual fallback card */}
            <div
              className="rounded-3xl border border-editorial-border bg-white p-6 shadow-sm"
              id="hybrid-question-card"
            >
              <div className="flex justify-between items-center mb-4 border-b border-editorial-border pb-3">
                <h4 className="font-serif text-lg font-semibold text-editorial-text leading-snug">
                  {currentStep.questionText}
                </h4>
                <button
                  onClick={handleReRecord}
                  className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-denim-700 bg-denim-50 hover:bg-denim-100/60 border border-editorial-border px-2.5 py-1.5 rounded-full shrink-0 uppercase cursor-pointer"
                  id="voice-re-record-btn"
                  title="Repeat question and re-record"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Repeat</span>
                </button>
              </div>

              {/* Option panels */}
              <div className="mt-3 max-h-52 overflow-y-auto p-1">
                {currentStep.type === 'select' && (
                  <div className="grid grid-cols-3 gap-2">
                    {currentStep.options?.map((opt: string) => {
                      const isSel = fitProfile[currentStep.field as keyof FitProfile] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleManualSelect(opt)}
                          style={{ minHeight: '44px' }}
                          className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                            isSel
                              ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text'
                              : 'border-editorial-border hover:border-gray-400 bg-white'
                          }`}
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
                        style={{ minHeight: '44px' }}
                        className="px-4 py-3 bg-warm-muted border border-editorial-border hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={() => handleManualSelect(fitProfile.weight)}
                      style={{ minHeight: '44px' }}
                      className="bg-denim-700 text-white rounded-xl text-xs font-bold tracking-widest uppercase px-4 py-3 cursor-pointer"
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
                          style={{ minHeight: '44px' }}
                          className={`w-full text-left py-2.5 px-4 text-xs rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                            isSel
                              ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text'
                              : 'border-editorial-border hover:border-gray-400 bg-white'
                          }`}
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
                            style={{ minHeight: '40px' }}
                            className={`py-2 px-2.5 text-[10px] text-left truncate rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSel
                                ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text'
                                : 'border-editorial-border hover:border-gray-400 bg-white'
                            }`}
                          >
                            <div
                              className={`h-3.5 w-3.5 border rounded flex items-center justify-center shrink-0 ${
                                isSel
                                  ? 'bg-denim-700 text-white border-denim-700'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
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
                      style={{ minHeight: '44px' }}
                      className={`w-full py-2.5 text-xs font-bold rounded-full tracking-widest uppercase text-white cursor-pointer ${
                        (fitProfile.brands || []).length > 0
                          ? 'bg-denim-700 hover:bg-denim-800'
                          : 'bg-gray-200 cursor-not-allowed'
                      }`}
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
                          style={{ minHeight: '44px' }}
                          className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                            isSel
                              ? 'border-denim-700 bg-denim-50 font-bold text-editorial-text'
                              : 'border-editorial-border hover:border-gray-400 bg-white'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-editorial-border">
                <button
                  onClick={() => {
                    if (activeStepIndex > 0) {
                      stopTTS();
                      stopListening();
                      stepEpochRef.current += 1;
                      setActiveStepIndex((prev) => prev - 1);
                    } else {
                      navigate('/choose-method');
                    }
                  }}
                  style={{ minHeight: '44px' }}
                  className="text-xs text-gray-400 hover:text-editorial-text font-bold uppercase tracking-widest cursor-pointer"
                >
                  Previous Step
                </button>
                <span className="text-[10px] text-gray-300 font-mono">
                  Step {activeStepIndex + 1} of {steps.length}
                </span>
                <button
                  onClick={() => {
                    stopTTS();
                    stopListening();
                    navigate('/choose-method');
                  }}
                  style={{ minHeight: '44px' }}
                  className="text-xs text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest cursor-pointer"
                >
                  Exit Voice
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
