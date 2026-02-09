import { useCallback, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

export const useSpeech = () => {
  const [location] = useLocation();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      // Get the voices and update state
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Effect to cancel speech when location changes
  useEffect(() => {
    // Cancel any ongoing speech when the location changes
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [location]);

  const getSpanishVoice = useCallback(() => {
    // Prioridad: 1. es-MX (mexicano), 2. es-419 (latinoamericano), 3. cualquier es (español)
    const mexicanVoice = voices.find(
      (voice) => voice.lang === "es-MX" && !voice.localService
    );
    const latinVoice = voices.find(
      (voice) =>
        (voice.lang === "es-419" || voice.lang.includes("419")) &&
        !voice.localService
    );
    const anySpanishVoice = voices.find(
      (voice) => voice.lang.startsWith("es") && !voice.localService
    );

    if (mexicanVoice) return mexicanVoice;
    if (latinVoice) return latinVoice;
    if (anySpanishVoice) return anySpanishVoice;

    return null;
  }, [voices]);

  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (!window.speechSynthesis) return false;

      // Workaround para bug de Chrome: si las voces no están cargadas, esperar
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) {
        // Las voces aún no están cargadas, reintentar después de un delay
        setTimeout(() => speak(text, options), 200);
        return true;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = options.lang || "es-MX";
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      const spanishVoice = getSpanishVoice();
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (options.onEnd) {
          options.onEnd();
        }
      };
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        // Si hay un error, intentar llamar onEnd para no bloquear el flujo
        if (options.onEnd) {
          options.onEnd();
        }
      };
      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);

      window.speechSynthesis.speak(utterance);

      return true;
    },
    [getSpanishVoice]
  );

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    voices,
  };
};
