import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pie3D, Bar3D, Area3D } from "./Charts3D";

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

  // Prepare 3D Area Chart data
  const areaLabels = monthlyData.map((m) => m.month);
  const areaSeries = [
    { name: "Skanlar", data: monthlyData.map((m) => m.scans), color: { start: "#00e5ff", end: "#00838f" } },
    { name: "Tashxislar", data: monthlyData.map((m) => m.diagnoses), color: { start: "#e040fb", end: "#9c27b0" } },
    { name: "Reabilitatsiya", data: monthlyData.map((m) => m.rehabs), color: { start: "#7c4dff", end: "#4a148c" } },
  ];

  // Prepare 3D Pie data
  const pieData = diseaseData.map((d) => ({ label: d.name, value: d.value }));

  // Prepare 3D Bar data from monthly totals
  const barData = monthlyData.map((m) => ({
    label: m.month,
    value: m.scans + m.diagnoses + m.rehabs,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: 3D Area Chart + 3D Pie Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly 3D Area Chart */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
        >
          <div className="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 space-y-1.5">
              <h4 className="font-display font-semibold text-sm text-foreground">Oylik tahlillar</h4>
              <p className="text-xs text-muted-foreground">So'nggi 6 oydagi faoliyat (3D)</p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold text-foreground tabular-nums">
              Jami {totalMonthly}
            </span>
          </div>
          {monthlyData.length > 0 ? (
            <Area3D series={areaSeries} labels={areaLabels} />
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Ma'lumot yo'q</div>
          )}
        </motion.div>

        {/* Disease 3D Pie Chart */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
        >
          <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3 mb-4">
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-sm text-foreground">Kasallik turlari</h4>
              <p className="text-xs text-muted-foreground">Eng ko'p uchragan tashxislar (3D)</p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold text-foreground tabular-nums">
              Jami {totalDiseases}
            </span>
          </div>
          {diseaseData.length > 0 ? (
            <Pie3D data={pieData} />
          ) : (
            <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Tashxis ma'lumoti yo'q</div>
          )}
        </motion.div>
      </div>

      {/* Row 2: 3D Bar Chart */}
      {barData.some((b) => b.value > 0) && (
        <motion.div
          whileHover={{ y: -4 }}
          className="relative min-w-0 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-elevated border border-border/60 overflow-hidden"
        >
          <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3 mb-4">
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-sm text-foreground">Oylik umumiy ko'rsatkichlar</h4>
              <p className="text-xs text-muted-foreground">3D silindrsimon ustunlar</p>
            </div>
          </div>
          <Bar3D data={barData} />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardCharts;
