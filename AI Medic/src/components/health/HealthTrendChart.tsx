import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, TrendingDown, TrendingUp, Minus } from "lucide-react";
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
  const gradientId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
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
    sev === "normal" ? "hsl(var(--health-trend))" : sev === "mild" ? "hsl(var(--medical-teal))" : sev === "moderate" ? "hsl(var(--medical-orange))" : "hsl(var(--medical-red))";

  const data = points.map((p, index) => ({ ...p, index, day: fmt(p.date) }));
  const dateTicks = data.filter((p, i) => i === 0 || p.day !== data[i - 1].day).map((p) => p.index);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-7">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hue }} />
            <h4 className="font-display font-semibold text-sm text-foreground leading-snug">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Oxirgi tekshiruvlar natijasi</p>
        </div>
        {last && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold" style={{ color: hue }}>{SEVERITY_LABEL[sev]}</span>
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-3xl font-display font-bold text-foreground">{last.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
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
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hue} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={hue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border) / 0.5)" vertical={false} />
              <XAxis dataKey="index" ticks={dateTicks} tickFormatter={(index) => data[index]?.day ?? ""} minTickGap={36} tickMargin={12} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis hide domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
              <ReferenceLine y={65} stroke="hsl(var(--medical-orange) / 0.4)" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelFormatter={(index) => { const point = data[Number(index)]; return point ? new Date(point.date).toLocaleString("uz-UZ") : ""; }}
                formatter={(v: any, _n: any, p: any) => [`${v}/100`, p?.payload?.label || "Holat"]}
              />
              <Area type="monotone" dataKey="score" stroke={hue} strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={!reduceMotion} dot={data.length === 1 ? { r: 4, fill: hue, strokeWidth: 0 } : false} activeDot={{ r: 5, fill: hue, stroke: "hsl(var(--card))", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border/60 text-xs">
            <div className="flex min-w-0 items-center gap-2"><span className="rounded-lg bg-secondary/70 p-1.5 shrink-0"><ClipboardList size={14} className="text-muted-foreground" /></span><span className="text-muted-foreground leading-relaxed">{last?.label}</span></div>
            <span
              className={`flex shrink-0 items-center gap-1.5 font-semibold tabular-nums ${
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
