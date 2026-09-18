import { useMemo } from "react";
import { motion } from "framer-motion";

/* ─────────── COLORS ─────────── */
const PIE_COLORS = [
  { start: "#e040fb", end: "#9c27b0" },   // magenta → purple
  { start: "#00e5ff", end: "#00838f" },   // cyan → teal
  { start: "#536dfe", end: "#283593" },   // indigo → dark blue
  { start: "#7c4dff", end: "#4a148c" },   // violet → deep purple
  { start: "#ff6d00", end: "#e65100" },   // orange → deep orange
  { start: "#00e676", end: "#1b5e20" },   // green → dark green
];

const BAR_COLORS = [
  { start: "#FFB74D", end: "#FF9800" },   // orange
  { start: "#4FC3F7", end: "#0288D1" },   // light blue
  { start: "#4DD0E1", end: "#00838F" },   // teal
  { start: "#7E57C2", end: "#4A148C" },   // purple
  { start: "#BA68C8", end: "#6A1B9A" },   // violet
  { start: "#5C6BC0", end: "#283593" },   // indigo
];

/* ═══════════════════════════════════════════════════════════
   3D PIE CHART — Pure SVG with isometric perspective
   ═══════════════════════════════════════════════════════════ */
interface PieSlice {
  label: string;
  value: number;
}

interface Pie3DProps {
  data: PieSlice[];
  width?: number;
  height?: number;
}

export const Pie3D = ({ data, width = 340, height = 300 }: Pie3DProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const cx = width / 2;
  const cy = height / 2 - 12;
  const rx = 110;
  const ry = 60;
  const depth = 28;

  const slices = useMemo(() => {
    let angle = -Math.PI / 2;
    return data.map((d, i) => {
      const sweep = (d.value / total) * 2 * Math.PI;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;
      const midAngle = startAngle + sweep / 2;
      return { ...d, startAngle, endAngle, midAngle, idx: i };
    });
  }, [data, total]);

  const ellipsePoint = (angle: number, yOff = 0) => ({
    x: cx + rx * Math.cos(angle),
    y: cy + ry * Math.sin(angle) + yOff,
  });

  const slicePath = (start: number, end: number, yOff: number) => {
    const p0 = ellipsePoint(start, yOff);
    const p1 = ellipsePoint(end, yOff);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M${cx},${cy + yOff} L${p0.x},${p0.y} A${rx},${ry} 0 ${largeArc},1 ${p1.x},${p1.y} Z`;
  };

  const sidePath = (start: number, end: number) => {
    const p0Top = ellipsePoint(start, 0);
    const p1Top = ellipsePoint(end, 0);
    const p0Bot = ellipsePoint(start, depth);
    const p1Bot = ellipsePoint(end, depth);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M${p0Top.x},${p0Top.y} L${p0Bot.x},${p0Bot.y} A${rx},${ry} 0 ${largeArc},1 ${p1Bot.x},${p1Bot.y} L${p1Top.x},${p1Top.y} A${rx},${ry} 0 ${largeArc},0 ${p0Top.x},${p0Top.y} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
        <defs>
          {slices.map((s) => (
            <linearGradient key={`pg${s.idx}`} id={`pie-g-${s.idx}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={PIE_COLORS[s.idx % PIE_COLORS.length].start} />
              <stop offset="100%" stopColor={PIE_COLORS[s.idx % PIE_COLORS.length].end} />
            </linearGradient>
          ))}
          <filter id="pie-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
          </filter>
        </defs>

        {/* Side depth faces — only show for visible slices */}
        <g filter="url(#pie-shadow)">
          {slices.map((s) => (
            <motion.path
              key={`side-${s.idx}`}
              d={sidePath(s.startAngle, s.endAngle)}
              fill={PIE_COLORS[s.idx % PIE_COLORS.length].end}
              opacity={0.7}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: s.idx * 0.1 }}
            />
          ))}
        </g>

        {/* Top faces */}
        {slices.map((s) => (
          <motion.path
            key={`top-${s.idx}`}
            d={slicePath(s.startAngle, s.endAngle, 0)}
            fill={`url(#pie-g-${s.idx})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: s.idx * 0.1, type: "spring", stiffness: 100 }}
          />
        ))}

        {/* Labels with connectors */}
        {slices.map((s) => {
          const labelR = rx + 40;
          const labelRy = ry + 26;
          const p = ellipsePoint(s.midAngle, 0);
          const lx = cx + labelR * Math.cos(s.midAngle);
          const ly = cy + labelRy * Math.sin(s.midAngle);
          const pct = Math.round((s.value / total) * 100);
          return (
            <g key={`label-${s.idx}`}>
              <line x1={p.x} y1={p.y} x2={lx} y2={ly} stroke={PIE_COLORS[s.idx % PIE_COLORS.length].start} strokeWidth={1} opacity={0.6} />
              <circle cx={lx} cy={ly} r={3} fill={PIE_COLORS[s.idx % PIE_COLORS.length].start} />
              <rect
                x={lx - 28} y={ly - 22} width={56} height={36} rx={6}
                fill="hsl(var(--card))" stroke={PIE_COLORS[s.idx % PIE_COLORS.length].start} strokeWidth={1.5} opacity={0.95}
              />
              <text x={lx} y={ly - 8} textAnchor="middle" className="text-[9px] font-medium" fill="hsl(var(--muted-foreground))">
                {s.label.slice(0, 8)}
              </text>
              <text x={lx} y={ly + 8} textAnchor="middle" className="text-[13px] font-bold" fill="hsl(var(--foreground))">
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   3D BAR CHART — Glossy Cylinder Bars
   ═══════════════════════════════════════════════════════════ */
interface BarItem {
  label: string;
  value: number;
}

interface Bar3DProps {
  data: BarItem[];
  width?: number;
  height?: number;
}

export const Bar3D = ({ data, width = 380, height = 280 }: Bar3DProps) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 42;
  const gap = Math.max(12, (width - data.length * barWidth) / (data.length + 1));
  const chartBottom = height - 40;
  const maxBarH = chartBottom - 30;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={`bg${i}`} id={`bar-g-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BAR_COLORS[i % BAR_COLORS.length].start} />
              <stop offset="100%" stopColor={BAR_COLORS[i % BAR_COLORS.length].end} />
            </linearGradient>
          ))}
          {data.map((_, i) => (
            <linearGradient key={`bsh${i}`} id={`bar-shine-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          ))}
          <filter id="bar-shadow">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.2)" />
          </filter>
        </defs>

        {/* Reflection floor */}
        <rect x={0} y={chartBottom} width={width} height={4} rx={2} fill="hsl(var(--border))" opacity={0.3} />

        {data.map((d, i) => {
          const barH = (d.value / maxVal) * maxBarH;
          const x = gap + i * (barWidth + gap);
          const y = chartBottom - barH;
          const ellipseRy = 7;

          return (
            <motion.g
              key={i}
              filter="url(#bar-shadow)"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 80 }}
              style={{ transformOrigin: `${x + barWidth / 2}px ${chartBottom}px` }}
            >
              {/* Cylinder body */}
              <rect x={x} y={y + ellipseRy} width={barWidth} height={barH - ellipseRy} rx={0} fill={`url(#bar-g-${i})`} />

              {/* Glossy shine overlay */}
              <rect x={x} y={y + ellipseRy} width={barWidth / 2.5} height={barH - ellipseRy} rx={0} fill={`url(#bar-shine-${i})`} />

              {/* Top ellipse */}
              <ellipse cx={x + barWidth / 2} cy={y + ellipseRy} rx={barWidth / 2} ry={ellipseRy} fill={BAR_COLORS[i % BAR_COLORS.length].start} />

              {/* Bottom ellipse (base) */}
              <ellipse cx={x + barWidth / 2} cy={chartBottom} rx={barWidth / 2} ry={ellipseRy} fill={BAR_COLORS[i % BAR_COLORS.length].end} opacity={0.5} />

              {/* Value label */}
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[11px] font-bold" fill="hsl(var(--foreground))">
                {d.value}
              </text>

              {/* Bottom label */}
              <text x={x + barWidth / 2} y={chartBottom + 24} textAnchor="middle" className="text-[10px]" fill="hsl(var(--muted-foreground))">
                {d.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   3D AREA CHART — Layered 3D surfaces
   ═══════════════════════════════════════════════════════════ */
interface AreaSeries {
  name: string;
  data: number[];
  color: { start: string; end: string };
}

interface Area3DProps {
  series: AreaSeries[];
  labels: string[];
  width?: number;
  height?: number;
}

export const Area3D = ({ series, labels, width = 380, height = 260 }: Area3DProps) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...series.flatMap((s) => s.data), 1);
  const stepX = chartW / Math.max(labels.length - 1, 1);
  const depthOffset = 12;

  const buildPath = (values: number[], yOffset: number) => {
    const points = values.map((v, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (v / maxVal) * chartH + yOffset,
    }));

    // Build smooth curve
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      d += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }

    // Close to bottom
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    d += ` L${lastPt.x},${padding.top + chartH + yOffset}`;
    d += ` L${firstPt.x},${padding.top + chartH + yOffset} Z`;
    return d;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`area-g-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color.start} stopOpacity={0.85} />
              <stop offset="100%" stopColor={s.color.end} stopOpacity={0.3} />
            </linearGradient>
          ))}
          <filter id="area-shadow">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padding.left}
            y1={padding.top + chartH * (1 - f)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - f)}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.4}
          />
        ))}

        {/* Series rendered back-to-front for 3D depth */}
        {[...series].reverse().map((s, ri) => {
          const i = series.length - 1 - ri;
          const yOff = i * depthOffset;
          return (
            <motion.path
              key={i}
              d={buildPath(s.data, yOff)}
              fill={`url(#area-g-${i})`}
              stroke={s.color.start}
              strokeWidth={2}
              filter="url(#area-shadow)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            />
          );
        })}

        {/* X-axis labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={padding.left + i * stepX}
            y={height + 8}
            textAnchor="middle"
            className="text-[10px]"
            fill="hsl(var(--muted-foreground))"
          >
            {l}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
        {series.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: s.color.start }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   RESULT CHART — For AI Radiologist / AI Assistant results
   ═══════════════════════════════════════════════════════════ */
interface ResultGaugeProps {
  label: string;
  value: number; // 0-100
  severity?: string;
}

export const ResultGauge3D = ({ label, value, severity }: ResultGaugeProps) => {
  const data: PieSlice[] = [
    { label, value },
    { label: "Qolgan", value: Math.max(0, 100 - value) },
  ];

  const cx = 90;
  const cy = 70;
  const rx = 60;
  const ry = 35;
  const depthVal = 16;

  const angle1 = -Math.PI / 2;
  const sweep1 = (value / 100) * 2 * Math.PI;
  const angle2 = angle1 + sweep1;
  const sweep2 = 2 * Math.PI - sweep1;

  const ellipsePoint = (a: number, yOff = 0) => ({
    x: cx + rx * Math.cos(a),
    y: cy + ry * Math.sin(a) + yOff,
  });

  const slicePath = (start: number, end: number, yOff: number) => {
    const p0 = ellipsePoint(start, yOff);
    const p1 = ellipsePoint(end, yOff);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M${cx},${cy + yOff} L${p0.x},${p0.y} A${rx},${ry} 0 ${largeArc},1 ${p1.x},${p1.y} Z`;
  };

  const sidePath = (start: number, end: number) => {
    const p0Top = ellipsePoint(start, 0);
    const p1Top = ellipsePoint(end, 0);
    const p0Bot = ellipsePoint(start, depthVal);
    const p1Bot = ellipsePoint(end, depthVal);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M${p0Top.x},${p0Top.y} L${p0Bot.x},${p0Bot.y} A${rx},${ry} 0 ${largeArc},1 ${p1Bot.x},${p1Bot.y} L${p1Top.x},${p1Top.y} A${rx},${ry} 0 ${largeArc},0 ${p0Top.x},${p0Top.y} Z`;
  };

  const mainColor = value >= 80 ? "#00e676" : value >= 60 ? "#4FC3F7" : value >= 40 ? "#FFB74D" : "#ef5350";
  const mainDark = value >= 80 ? "#1b5e20" : value >= 60 ? "#01579b" : value >= 40 ? "#e65100" : "#b71c1c";
  const bgColor = "hsl(var(--secondary))";

  return (
    <div className="flex flex-col items-center">
      <svg width={180} height={160} viewBox="0 0 180 160">
        <defs>
          <linearGradient id="rg-main" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mainColor} />
            <stop offset="100%" stopColor={mainDark} />
          </linearGradient>
          <filter id="rg-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.2)" />
          </filter>
        </defs>

        {/* Side faces */}
        <path d={sidePath(angle2, angle1 + 2 * Math.PI)} fill={bgColor} opacity={0.4} />
        <path d={sidePath(angle1, angle2)} fill={mainDark} opacity={0.6} />

        {/* Top — background slice */}
        <path d={slicePath(angle2, angle1 + 2 * Math.PI, 0)} fill={bgColor} opacity={0.5} />

        {/* Top — value slice */}
        <motion.path
          d={slicePath(angle1, angle2, 0)}
          fill="url(#rg-main)"
          filter="url(#rg-shadow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Center text */}
        <text x={cx} y={cy - 2} textAnchor="middle" className="text-2xl font-display font-bold" fill="hsl(var(--foreground))">
          {value}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="text-[10px]" fill="hsl(var(--muted-foreground))">
          {severity || label}
        </text>
      </svg>
    </div>
  );
};
