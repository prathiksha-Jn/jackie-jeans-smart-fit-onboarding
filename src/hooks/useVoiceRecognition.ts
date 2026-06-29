/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceRecognitionProps {
  onFinalResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition({
  onFinalResult,
  onEnd,
  onError,
}: UseVoiceRecognitionProps = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  // Store callbacks in refs so recognition handlers always see latest version
  const onFinalResultRef = useRef(onFinalResult);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);
  useEffect(() => { onFinalResultRef.current = onFinalResult; }, [onFinalResult]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Track whether we have already fired the final result for this session
  const finalFiredRef = useRef(false);
  // Track whether recognition is intentionally active
  const activeRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onErrorRef.current?.('Speech recognition is not supported in this browser.');
      return;
    }

    // Abort any existing session first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    finalFiredRef.current = false;
    activeRef.current = true;
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Only process if we are intentionally listening
      if (!activeRef.current) return;

      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
      }

      // Only fire final result ONCE per listening session
      if (finalText && !finalFiredRef.current) {
        const trimmed = finalText.trim();
        // Reject suspiciously short or numeric-only noise (e.g. "5.0", "hmm")
        if (trimmed.length >= 2 && !/^[\d.]+$/.test(trimmed)) {
          finalFiredRef.current = true;
          activeRef.current = false;
          setIsListening(false);
          setInterimTranscript('');
          onFinalResultRef.current?.(trimmed);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (!activeRef.current) return;
      if (event.error === 'no-speech') {
        onEndRef.current?.();
        return;
      }
      activeRef.current = false;
      setIsListening(false);
      let msg = 'An error occurred during speech recognition.';
      if (event.error === 'not-allowed') {
        msg = 'Microphone access was denied. Please allow microphone permissions in your browser.';
      } else if (event.error === 'network') {
        msg = 'A network error occurred during speech recognition.';
      }
      onErrorRef.current?.(msg);
    };

    recognition.onend = () => {
      if (!finalFiredRef.current && activeRef.current) {
        // Recognition ended without a final result (e.g. silence)
        activeRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
        onEndRef.current?.();
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      activeRef.current = false;
      setIsListening(false);
      onErrorRef.current?.(err.message || 'Could not start speech recognition.');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  };
}