import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const COLORS = [
  "hsl(var(--medical-teal))",
  "hsl(var(--medical-green))",
  "hsl(var(--medical-blue))",
  "hsl(var(--medical-purple))",
  "hsl(var(--medical-orange))",
  "hsl(var(--medical-red))",
];

const SERIES = [
  { key: "scans", name: "Skanlar", color: "hsl(var(--medical-teal))" },
  { key: "diagnoses", name: "Tashxislar", color: "hsl(var(--medical-green))" },
  { key: "rehabs", name: "Reabilitatsiya", color: "hsl(var(--medical-purple))" },
] as const;

const LegendDots = ({ items }: { items: { name: string; color: string }[] }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 mt-4 border-t border-border/60">
    {items.map((i) => (
      <span key={i.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
        {i.name}
      </span>
    ))}
  </div>
);

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p: any) => Number(p.value) > 0);
  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ma'lumot yo'q</p>
      ) : (
        rows.map((r: any) => (
          <p key={r.name} className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.name}: <span className="font-semibold text-foreground">{r.value}</span>
          </p>
        ))
      )}
    </div>
  );
};

const DashboardCharts = () => {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<{ month: string; scans: number; diagnoses: number; rehabs: number }[]>([]);
  const [diseaseData, setDiseaseData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadCharts = async () => {
      // Monthly data for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [scans, diagnoses, rehabs] = await Promise.all([
        supabase.from("scan_analyses").select("created_at").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
        supabase.from("diagnoses").select("created_at, condition_name").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
        supabase.from("rehab_sessions").select("created_at").eq("user_id", user.id).gte("created_at", sixMonthsAgo.toISOString()),
      ]);

      // Group by month
      const months: Record<string, { scans: number; diagnoses: number; rehabs: number }> = {};
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months[key] = { scans: 0, diagnoses: 0, rehabs: 0 };
      }

      (scans.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].scans++;
      });
      (diagnoses.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].diagnoses++;
      });
      (rehabs.data || []).forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) months[key].rehabs++;
      });

      setMonthlyData(
        Object.entries(months).map(([key, val]) => {
          const [, month] = key.split("-");
          return { month: monthNames[parseInt(month)], ...val };
        })
      );

      // Disease type stats
      const conditionCounts: Record<string, number> = {};
      (diagnoses.data || []).forEach((d: any) => {
        const name = d.condition_name || "Noma'lum";
        conditionCounts[name] = (conditionCounts[name] || 0) + 1;
      });

      const diseaseArr = Object.entries(conditionCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setDiseaseData(diseaseArr);
    };

    loadCharts();
  }, [user]);

  const totalDiseases = diseaseData.reduce((s, d) => s + d.value, 0);
  const totalMonthly = monthlyData.reduce((s, m) => s + m.scans + m.diagnoses + m.rehabs, 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Monthly Bar Chart */}
      <motion.div
        whileHover={{ y: -4 }}
        className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
      >
        <div className="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0 space-y-1.5">
            <h4 className="font-display font-semibold text-sm text-foreground">Oylik tahlillar</h4>
            <p className="text-xs text-muted-foreground">So'nggi 6 oydagi faoliyat</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold text-foreground tabular-nums">
            Jami {totalMonthly}
          </span>
        </div>
        {monthlyData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={5} barCategoryGap="24%" margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.5)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} width={34} allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip cursor={{ fill: "hsl(var(--secondary) / 0.45)", radius: 8 }} content={<BarTooltip />} />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[5, 5, 0, 0]} maxBarSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <LegendDots items={SERIES.map((s) => ({ name: s.name, color: s.color }))} />
          </>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
        )}
      </motion.div>

      {/* Disease Pie Chart */}
      <motion.div
        whileHover={{ y: -4 }}
        className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
      >
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative space-y-1.5 mb-6">
          <h4 className="font-display font-semibold text-sm text-foreground">Kasallik turlari</h4>
          <p className="text-xs text-muted-foreground">Eng ko'p uchragan tashxislar</p>
        </div>
        {diseaseData.length > 0 ? (
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative h-[180px] w-full sm:w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseData}
                    cx="50%" cy="50%"
                    outerRadius={82} innerRadius={56}
                    dataKey="value" paddingAngle={3}
                    stroke="none"
                    isAnimationActive
                  >
                    {diseaseData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "var(--shadow-elevated)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display font-bold text-foreground tabular-nums">{totalDiseases}</span>
                <span className="text-[11px] text-muted-foreground">tashxis</span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-2">
              {diseaseData.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground" title={d.name}>{d.name}</span>
                  <span className="shrink-0 font-semibold text-foreground tabular-nums">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Tashxis ma'lumoti yo'q</div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardCharts;
