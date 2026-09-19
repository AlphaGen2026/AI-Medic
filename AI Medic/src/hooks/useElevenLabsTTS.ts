import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseElevenLabsTTSProps {
  persona?: "aziz" | "aziza";
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export const useElevenLabsTTS = ({ persona = "aziz", onStart, onEnd, onError }: UseElevenLabsTTSProps = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    fallbackSynthesisRef.current = window.speechSynthesis;
    audioRef.current = new Audio();
    
    const handleAudioEnded = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    const handleAudioError = () => {
      console.error("Audio playback error");
      setIsSpeaking(false);
      onError?.();
    };

    audioRef.current.addEventListener("ended", handleAudioEnded);
    audioRef.current.addEventListener("error", handleAudioError);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnded);
        audioRef.current.removeEventListener("error", handleAudioError);
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (fallbackSynthesisRef.current) {
        fallbackSynthesisRef.current.cancel();
      }
    };
  }, [onEnd, onError]);

  const speakWithFallback = (cleanText: string, lang: string) => {
    if (!fallbackSynthesisRef.current) return;
    fallbackSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    fallbackUtteranceRef.current = utterance;
    utterance.lang = lang;

    const voices = fallbackSynthesisRef.current.getVoices();
    const langPrefix = lang.split("-")[0];
    const isFemale = persona === "aziza";

    let targetVoice = voices.find((v) =>
      v.lang.includes(langPrefix) &&
      (isFemale ? v.name.includes("Female") : (v.name.includes("Male") || v.name.includes("David") || v.name.includes("Dmitri")))
    );

    if (!targetVoice) targetVoice = voices.find((v) => v.lang.includes(langPrefix) && v.name.includes("Google"));
    if (!targetVoice) targetVoice = voices.find((v) => v.lang.includes(langPrefix));

    if (lang === "uz-UZ" && !targetVoice) {
      targetVoice = voices.find((v) => v.lang.includes("ru") && (isFemale ? v.name.includes("Female") : (v.name.includes("Male") || v.name.includes("Dmitri"))));
      if (!targetVoice) targetVoice = voices.find((v) => v.lang.includes("ru"));
    }

    if (targetVoice) utterance.voice = targetVoice;
    utterance.pitch = isFemale ? 1.1 : 0.85;
    utterance.rate = isFemale ? 1.0 : 0.95;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };
    utterance.onend = (e) => {
      if (fallbackUtteranceRef.current === e.utterance) {
        setIsSpeaking(false);
        onEnd?.();
      }
    };
    utterance.onerror = (e) => {
      if (fallbackUtteranceRef.current === e.utterance) {
        setIsSpeaking(false);
        onError?.();
      }
    };

    fallbackSynthesisRef.current.speak(utterance);
  };

  const speak = async (text: string) => {
    // Cancel any ongoing speech
    stop();

    if (!text.trim()) return;

    const cleanText = text.replace(/[*#`_]/g, "");
    
    // Detect language roughly
    const isRussian = /[А-Яа-яЁё]/.test(cleanText);
    const isEnglish = /^[A-Za-z\s.,!?'\-\d]+$/.test(cleanText) && !cleanText.toLowerCase().includes("qanday") && !cleanText.toLowerCase().includes("uchun");
    
    let lang = "uz-UZ";
    if (isRussian) lang = "ru-RU";
    else if (isEnglish) lang = "en-US";

    try {
      setIsSpeaking(true);
      onStart?.();

      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text: cleanText, lang, persona },
      });

      if (error) {
        throw error;
      }

      // Check if the response is an audio Blob/ArrayBuffer
      if (data instanceof Blob || data instanceof ArrayBuffer || (data && data.size)) {
         const blob = data instanceof Blob ? data : new Blob([data], { type: "audio/mpeg" });
         const url = URL.createObjectURL(blob);
         
         if (audioRef.current) {
            audioRef.current.src = url;
            await audioRef.current.play();
         }
      } else {
         throw new Error("Invalid response from TTS function");
      }

    } catch (error) {
      console.error("ElevenLabs TTS error, falling back to browser synthesis:", error);
      speakWithFallback(cleanText, lang);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (fallbackSynthesisRef.current) {
      fallbackSynthesisRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  return {
    speak,
    stop,
    isSpeaking
  };
};
