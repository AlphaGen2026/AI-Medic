import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Loader2,
  RefreshCw,
  Check,
  Bell,
  Moon,
  Utensils,
  Dumbbell,
  Briefcase,
  Pill,
  Droplets,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  DailyRoutine as Routine,
  RoutineCategory,
  clearRoutine,
  generateRoutine,
  loadProgress,
  loadRoutine,
  minutesOf,
  readChronic,
  storeProgress,
  storeRoutine,
  conditionLabel,
} from "@/lib/chronicConditions";

const CATEGORY_ICON: Record<RoutineCategory, JSX.Element> = {
  uyqu: <Moon size={15} />,
  ovqat: <Utensils size={15} />,
  mashq: <Dumbbell size={15} />,
  ish: <Briefcase size={15} />,
  dori: <Pill size={15} />,
  suv: <Droplets size={15} />,
};

const CATEGORY_STYLE: Record<RoutineCategory, string> = {
  uyqu: "bg-medical-purple-light text-medical-purple",
  ovqat: "bg-medical-green-light text-medical-green",
  mashq: "bg-medical-teal-light text-medical-teal",
  ish: "bg-medical-blue-light text-medical-blue",
  dori: "bg-medical-purple-light text-medical-purple",
  suv: "bg-medical-blue-light text-medical-blue",
};

const DailyRoutinePanel = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    if (!user) return;
    setRoutine(loadRoutine(user.id) ?? (user.user_metadata?.daily_routine as Routine | undefined) ?? null);
    setDone(loadProgress(user.id));
  }, [user, refreshKey]);

  useEffect(() => {
    const t = window.setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  const chronic = readChronic(user?.user_metadata);

  const currentIndex = useMemo(() => {
    if (!routine) return -1;
    let idx = -1;
    routine.steps.forEach((s, i) => {
      if (minutesOf(s.time) <= nowMin) idx = i;
    });
    return idx;
  }, [routine, nowMin]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      const r = await generateRoutine({
        conditions: chronic.ids,
        none: chronic.none,
        age: user.user_metadata?.age,
        gender: user.user_metadata?.gender,
      });
      storeRoutine(user.id, r);
      setRoutine(r);
      setDone([]);
      storeProgress(user.id, []);
      toast.success("Kunlik rejim tayyor");
    } catch {
      toast.error("Rejim tuzishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const toggleDone = (time: string) => {
    if (!user) return;
    const next = done.includes(time) ? done.filter((t) => t !== time) : [...done, time];
    setDone(next);
    storeProgress(user.id, next);
  };

  const percent = routine && routine.steps.length ? Math.round((done.length / routine.steps.length) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" /> AI kunlik rejim
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {chronic.none || chronic.ids.length === 0
              ? "Umumiy sog'lom turmush tarzi bo'yicha"
              : chronic.ids.map(conditionLabel).join(", ")}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg gradient-accent text-accent-foreground font-medium flex items-center gap-1.5 disabled:opacity-60 shrink-0"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {routine ? "Yangilash" : "Rejim tuzish"}
        </button>
      </div>

      {!routine ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Surunkali kasalliklaringizga mos uyqu, ovqatlanish, mashq va ish jadvalini AI tuzib beradi.
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Bell size={12} /> Vaqti kelganda bildirishnoma yuboriladi
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-medium text-foreground shrink-0">
              {done.length}/{routine.steps.length} • {percent}%
            </span>
          </div>

          <div className="space-y-2">
            {routine.steps.map((s, i) => {
              const isDone = done.includes(s.time);
              const isCurrent = i === currentIndex;
              const isPast = minutesOf(s.time) < nowMin && !isCurrent;
              return (
                <motion.div
                  key={s.time + s.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    isCurrent ? "border-primary bg-primary/5" : "border-border bg-secondary/40"
                  } ${isPast && !isDone ? "opacity-70" : ""}`}
                >
                  <button
                    onClick={() => toggleDone(s.time)}
                    aria-label="Bajarildi"
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone ? "gradient-primary text-primary-foreground border-transparent" : "border-border text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{s.time}</span>
                      <span className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {s.title}
                      </span>
                      <span className={`medical-badge ${CATEGORY_STYLE[s.category]} flex items-center gap-1`}>
                        {CATEGORY_ICON[s.category]} {CATEGORY_LABEL[s.category]}
                      </span>
                      {isCurrent && <span className="medical-badge bg-primary/15 text-primary">Hozir</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>
                    {s.reason && <p className="text-[11px] text-muted-foreground/80 mt-0.5 italic">{s.reason}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (!user) return;
              clearRoutine(user.id);
              setRoutine(null);
              setDone([]);
            }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Rejimni o'chirish
          </button>
        </>
      )}
    </div>
  );
};

export default DailyRoutinePanel;
