/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    // Clear the pending callback before cancelling so it doesn't fire
    onEndCallbackRef.current = null;
    window.speechSynthesis.cancel();
    if (isMountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech and clear previous callback
    onEndCallbackRef.current = null;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick a quality English voice
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Premium'))
        ) || voices.find((v) => v.lang.startsWith('en')) || null
      );
    };

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    onEndCallbackRef.current = onEnd || null;

    utterance.onstart = () => {
      if (isMountedRef.current) setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (isMountedRef.current) setIsSpeaking(false);
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb?.();
    };

    utterance.onerror = (event) => {
      // 'interrupted' fires when we intentionally cancel — don't propagate
      if (event.error === 'interrupted' || event.error === 'canceled') {
        if (isMountedRef.current) setIsSpeaking(false);
        return;
      }
      console.warn('Speech synthesis error:', event);
      if (isMountedRef.current) setIsSpeaking(false);
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb?.();
    };

    // Some browsers require a tiny delay after cancel() before speak()
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 60);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      onEndCallbackRef.current = null;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
  };
}