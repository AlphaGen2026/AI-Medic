import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { loadHealthHistory, scoreToSeverity, SEVERITY_LABEL, HealthPoint } from "@/lib/healthScore";

interface Props {
  /** Qiymati o'zgarganda grafik qayta yuklanadi */
  refreshKey?: number | string;
  title?: string;
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const HealthTrendChart = ({ refreshKey, title = "Salomatlik dinamikasi" }: Props) => {
  const { user } = useAuth();
  const [points, setPoints] = useState<HealthPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    loadHealthHistory(user.id).then((p) => {
      if (alive) {
        setPoints(p);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [user, refreshKey]);

  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const delta = last && prev ? last.score - prev.score : 0;
  const sev = last ? scoreToSeverity(last.score) : "normal";

  const hue =
    sev === "normal" ? "hsl(165, 60%, 45%)" : sev === "mild" ? "hsl(195, 85%, 42%)" : sev === "moderate" ? "hsl(25, 90%, 55%)" : "hsl(0, 72%, 55%)";

  const data = points.map((p) => ({ ...p, day: fmt(p.date) }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-2xl p-5 shadow-card border border-border overflow-hidden"
    >
      <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: hue }} />
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: hue }} />
          <h4 className="font-display font-bold text-foreground">{title}</h4>
        </div>
        {last && (
          <div className="flex items-center gap-2">
            <span className="medical-badge bg-secondary text-foreground/80">{SEVERITY_LABEL[sev]}</span>
            <span className="text-lg font-display font-bold" style={{ color: hue }}>
              {last.score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Yuklanmoqda...</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
          Hali tahlil qilinmagan. Tasvir tahlilidan so'ng salomatlik grafigi shu yerda paydo bo'ladi.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hue} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={hue} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine y={65} stroke="hsl(25, 90%, 55%)" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v: any, _n: any, p: any) => [`${v}/100`, p?.payload?.label || "Holat"]}
              />
              <Area type="monotone" dataKey="score" stroke={hue} strokeWidth={2.5} fill="url(#healthGrad)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-muted-foreground">{last?.label}</span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                delta > 0 ? "text-medical-green" : delta < 0 ? "text-medical-red" : "text-muted-foreground"
              }`}
            >
              {delta > 0 ? <TrendingUp size={14} /> : delta < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              {delta > 0 ? `+${delta}` : delta} ball
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default HealthTrendChart;
