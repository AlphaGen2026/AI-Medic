import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";
import {
  VOICE_LANGS,
  UI_TEXT,
  IDENTITY_ANSWER,
  isIdentityQuestion,
  parseVoiceCommand,
  executeVoiceCommand,
  type VoiceLang,
} from "@/lib/voiceAgent";

const AIVoiceCompanion = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState<VoiceLang>("uz");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const langRef = useRef<VoiceLang>("uz");
  const userRef = useRef(user);

  const { speak: speakText, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    persona: "bobur",
  });

  useEffect(() => {
    langRef.current = lang;
    if (recognitionRef.current) recognitionRef.current.lang = VOICE_LANGS[lang].speech;
  }, [lang]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const t = UI_TEXT[lang];

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = VOICE_LANGS[langRef.current].speech;
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleUserSpeech(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(UI_TEXT[langRef.current].noSpeech);
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
    } else {
      toast.error(UI_TEXT[langRef.current].unsupported);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    stopSpeaking();
    setTranscript("");
    setAiResponse("");
    try {
      recognitionRef.current.lang = VOICE_LANGS[langRef.current].speech;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const respond = (text: string) => {
    setAiResponse(text);
    speakText(text);
  };

  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;
    const currentLang = langRef.current;

    // 1. "Who are you?" — Bobur introduces himself.
    if (isIdentityQuestion(text)) {
      respond(IDENTITY_ANSWER[currentLang]);
      return;
    }

    // 2. Action commands — Bobur acts in the app like the user would.
    const command = parseVoiceCommand(text);
    if (command && userRef.current) {
      setLoading(true);
      try {
        const reply = await executeVoiceCommand(command, currentLang, userRef.current.id);
        respond(reply);
      } catch (err) {
        console.error(err);
        respond(UI_TEXT[currentLang].error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Everything else — medical conversation through the AI assistant.
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: text,
          messages: [],
          language: currentLang,
        },
      });
      if (error) throw error;
      respond(data?.response || data?.diagnosis || UI_TEXT[currentLang].error);
    } catch (err) {
      console.error(err);
      respond(UI_TEXT[currentLang].error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t.title}</h2>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-secondary border border-border">
          {(Object.keys(VOICE_LANGS) as VoiceLang[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                lang === code
                  ? "gradient-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {VOICE_LANGS[code].flag} {VOICE_LANGS[code].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative bg-card rounded-3xl border border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="relative mb-12 mt-10">
          <AnimatePresence>
            {(isListening || isSpeaking || loading) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-[-40px] rounded-full bg-primary/20 blur-2xl"
              />
            )}
          </AnimatePresence>

          <motion.div
            animate={{ scale: isListening ? [1, 1.1, 1] : isSpeaking ? [1, 1.2, 1] : 1 }}
            transition={{
              duration: isListening ? 1.5 : isSpeaking ? 0.8 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`w-40 h-40 rounded-full flex items-center justify-center relative z-10 shadow-2xl ${
              isListening
                ? "bg-red-500 text-white"
                : isSpeaking
                  ? "gradient-primary text-white"
                  : "bg-secondary border-4 border-card text-primary"
            }`}
          >
            {loading ? (
              <Brain size={48} className="animate-pulse" />
            ) : isListening ? (
              <Mic size={48} className="animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 size={48} />
            ) : (
              <Sparkles size={48} />
            )}
          </motion.div>
          <p className="mt-4 text-center text-sm font-semibold tracking-wide text-muted-foreground">
            BOBUR
          </p>
        </div>

        <div className="w-full max-w-lg px-6 text-center h-32 flex flex-col justify-end pb-8 z-10">
          {transcript && !aiResponse && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-foreground italic"
            >
              "{transcript}"
            </motion.p>
          )}
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
              <p className="text-lg font-medium text-primary">
                {aiResponse.replace(/[*#`_]/g, "")}
              </p>
            </motion.div>
          )}
          {!transcript && !aiResponse && !isListening && (
            <div className="space-y-2">
              <p className="text-muted-foreground">{t.idle}</p>
              <p className="text-xs text-muted-foreground/70">{t.hint}</p>
            </div>
          )}
          {isListening && !transcript && (
            <p className="text-primary font-medium animate-pulse">{t.listening}</p>
          )}
          {loading && <p className="text-muted-foreground text-sm">{t.thinking}</p>}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/80 transition-all border border-border"
            >
              <Volume2 size={20} className="opacity-50" />
            </button>
          )}

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
              isListening ? "bg-red-500 hover:bg-red-600" : "gradient-primary"
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIVoiceCompanion;
