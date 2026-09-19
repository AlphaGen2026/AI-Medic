import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Settings, Volume2, Sparkles, User, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AI_PERSONA = "aziz" | "aziza";

const AIVoiceCompanion = () => {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;

    // Initialize SpeechRecognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "uz-UZ";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleSendToAI(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error("Ovozni aniqlashda xatolik yuz berdi");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast.error("Brauzeringiz ovozli xizmatni qo'llab-quvvatlamaydi");
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthesisRef.current) synthesisRef.current.cancel();
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    if (synthesisRef.current) synthesisRef.current.cancel(); // stop current speech
    setIsSpeaking(false);
    setTranscript("");
    setAiResponse("");
    try {
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

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();

    // Clean up markdown before speaking
    const cleanText = text.replace(/[*#`_]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Detect language roughly
    const isRussian = /[А-Яа-яЁё]/.test(cleanText);
    const isEnglish = /^[A-Za-z\s.,!?'-]+$/.test(cleanText) && !cleanText.toLowerCase().includes("qanday") && !cleanText.toLowerCase().includes("uchun"); 
    
    let lang = "uz-UZ";
    if (isRussian) lang = "ru-RU";
    else if (isEnglish) lang = "en-US";
    
    utterance.lang = lang;
    
    const voices = synthesisRef.current.getVoices();
    let targetVoice = voices.find(v => v.lang.includes(lang.split('-')[0]) && (v.name.includes("Female") || v.name.includes("Google")));
    if (!targetVoice) targetVoice = voices.find(v => v.lang.includes(lang.split('-')[0]));
    
    // Fallback for Uzbek if no local voice
    if (lang === "uz-UZ" && !targetVoice) {
      targetVoice = voices.find(v => v.lang.includes("ru") && v.name.includes("Female"));
    }

    utterance.pitch = 1.1;
    utterance.rate = 1.0;

    if (targetVoice) utterance.voice = targetVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const handleSendToAI = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: text,
          messages: [], 
        },
      });

      if (error) throw error;

      let responseText = data?.response || data?.diagnosis || "Kechirasiz, tushunmadim.";
      
      // Parse commands
      const commandMatch = responseText.match(/COMMAND:\s*({.*})/);
      if (commandMatch) {
         try {
            const cmd = JSON.parse(commandMatch[1]);
            if (cmd.action === "navigate" && cmd.target) {
               window.dispatchEvent(new CustomEvent('app:navigate', { detail: cmd.target }));
            }
         } catch(e) {
            console.error("Command parse error", e);
         }
         responseText = responseText.replace(/COMMAND:\s*({.*})/, "").trim();
      }

      setAiResponse(responseText);
      speakText(responseText);

    } catch (err) {
      console.error(err);
      const fallback = "Ulanishda xatolik yuz berdi.";
      setAiResponse(fallback);
      speakText(fallback);
    } finally {
      setLoading(false);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Ovozli Hamroh</h2>
        <p className="text-muted-foreground mt-1">Sog'ligingiz haqida ovozli tarzda suhbatlashing</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative bg-card rounded-3xl border border-border overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        {/* Central Orb */}
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
            animate={{
              scale: isListening ? [1, 1.1, 1] : isSpeaking ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: isListening ? 1.5 : isSpeaking ? 0.8 : 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`w-40 h-40 rounded-full flex items-center justify-center relative z-10 shadow-2xl ${
              isListening ? "bg-red-500 text-white" : isSpeaking ? "gradient-primary text-white" : "bg-secondary border-4 border-card text-primary"
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
        </div>

        {/* Text Display */}
        <div className="w-full max-w-lg px-6 text-center h-32 flex flex-col justify-end pb-8 z-10">
          {transcript && !aiResponse && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-medium text-foreground italic">
              "{transcript}"
            </motion.p>
          )}
          {aiResponse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               <p className="text-sm text-muted-foreground italic mb-2">"{transcript}"</p>
               <p className="text-lg font-medium text-primary">
                 {isSpeaking ? aiResponse.replace(/[*#`_]/g, "") : aiResponse.replace(/[*#`_]/g, "").substring(0, 100) + (aiResponse.length > 100 ? "..." : "")}
               </p>
            </motion.div>
          )}
          {!transcript && !aiResponse && !isListening && (
            <p className="text-muted-foreground">Suhbatni boshlash uchun pastdagi tugmani bosing</p>
          )}
          {isListening && !transcript && (
            <p className="text-primary font-medium animate-pulse">Eshitmoqdaman...</p>
          )}
        </div>

        {/* Controls */}
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
