import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Brain, Volume2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";

const FloatingAziz = () => {
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const recognitionRef = useRef<any>(null);
  
  const { speak: speakText, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    persona: "aziz",
    onEnd: () => setTimeout(() => setIsOpen(false), 3000)
  });

  useEffect(() => {

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
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      stopSpeaking();
    };
  }, []);



  const handleSendToAI = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setIsOpen(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: text,
          messages: [], 
        },
      });

      if (error) throw error;

      let responseText = data?.response || data?.diagnosis || "Kechirasiz, tushunmadim.";
      
      // Parse all commands (navigate, action, etc.)
      const commandMatch = responseText.match(/COMMAND:\s*({.*})/);
      if (commandMatch) {
         try {
            const cmd = JSON.parse(commandMatch[1]);
            if (cmd.action === "navigate" && cmd.target) {
               window.dispatchEvent(new CustomEvent('app:navigate', { detail: cmd.target }));
            }
            if (cmd.action === "book_appointment") {
               // Navigate to appointments and trigger booking
               window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'appointments' }));
               setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('app:action', { detail: { type: 'open_booking' } }));
               }, 500);
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

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Brauzeringiz ovozli xizmatni qo'llab-quvvatlamaydi");
      return;
    }
    stopSpeaking(); 
    setTranscript("");
    setAiResponse("");
    setIsOpen(true);
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

  const toggleListen = () => {
    if (isListening) stopListening();
    else if (isSpeaking) stopSpeaking();
    else startListening();
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed bottom-24 right-6 z-[100] flex flex-col items-end gap-3 cursor-grab active:cursor-grabbing"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-4 rounded-2xl w-64 md:w-72 relative origin-bottom-right"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
            <p className="text-xs text-primary font-bold mb-2">Aziz AI 🎙️</p>
            <div className="text-sm">
              {transcript && (
                <p className="text-muted-foreground italic mb-2">"{transcript}"</p>
              )}
              {loading && <div className="flex items-center gap-2 text-primary font-medium"><Brain size={16} className="animate-pulse" /> O'ylamoqdaman...</div>}
              {aiResponse && (
                <p className="text-foreground font-medium">
                  {aiResponse.replace(/[*#`_]/g, "").length > 120 && !isSpeaking
                    ? aiResponse.replace(/[*#`_]/g, "").substring(0, 120) + "..."
                    : aiResponse.replace(/[*#`_]/g, "")}
                </p>
              )}
              {isListening && !transcript && (
                <p className="text-primary font-medium animate-pulse flex items-center gap-2"><Mic size={16} /> Eshitmoqdaman...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListen}
        title="Aziz AI — Ovozli yordamchi"
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl border-4 ${
          isListening 
            ? "bg-red-500 border-red-200 animate-pulse" 
            : isSpeaking 
              ? "gradient-primary border-primary/30" 
              : "bg-card border-primary text-primary"
        }`}
      >
        {loading ? (
          <Brain size={24} className="animate-pulse text-white" />
        ) : isSpeaking ? (
          <Volume2 size={24} className="text-white" />
        ) : isListening ? (
          <MicOff size={24} className="text-white" />
        ) : (
          <Mic size={24} className={!isListening && !isSpeaking ? "text-primary" : "text-white"} />
        )}
      </motion.button>
    </motion.div>
  );
};

export default FloatingAziz;
