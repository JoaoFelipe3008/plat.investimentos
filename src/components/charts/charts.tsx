"use client";

import { useReducedMotion } from "motion/react";
import { useId } from "react";
import {
  Area,
  AreaChart as RAreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const UP = "#25D695";
const DOWN = "#EF5A67";
const NEUTRAL = "#F5F7FA";

export interface SeriesPoint {
  t: number;
  [k: string]: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: number;
  format: (v: number) => string;
  labelFormat: (t: number) => string;
}) {
  if (!active || !payload?.length || label == null) return null;
  return (
    <div className="rounded-md border border-line-strong bg-elevated px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="mb-1 text-muted">{labelFormat(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="num flex items-center gap-2 font-medium text-fg">
          {payload.length > 1 && <span className="size-2 rounded-full" style={{ background: p.color }} />}
          {payload.length > 1 && <span className="font-normal text-muted">{p.name}</span>}
          <span>{format(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Gráfico de área para séries temporais. A cor segue o significado financeiro:
 * verde se o período terminou acima do início, vermelho se abaixo; neutro quando `tone="neutral"`.
 */
export function TimeAreaChart({
  data,
  dataKey = "v",
  height = 240,
  format,
  labelFormat,
  tone = "auto",
  compareKey,
  compareLabel,
  mainLabel,
  showAxis = true,
  curve = "monotone",
  className,
}: {
  data: { t: number }[] & object[];
  dataKey?: string;
  height?: number;
  format: (v: number) => string;
  labelFormat?: (t: number) => string;
  tone?: "auto" | "neutral";
  compareKey?: string;
  compareLabel?: string;
  mainLabel?: string;
  showAxis?: boolean;
  curve?: "monotone" | "stepAfter";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const rows = data as unknown as Record<string, number>[];
  const first = rows[0]?.[dataKey];
  const last = rows.at(-1)?.[dataKey];
  const color = tone === "neutral" || first == null || last == null ? NEUTRAL : last >= first ? UP : DOWN;
  const spanDays = data.length > 1 ? (data.at(-1)!.t - data[0].t) / 86_400_000 : 0;
  const tickFmt = (t: number) =>
    new Date(t).toLocaleString("pt-BR", spanDays <= 2 ? { hour: "2-digit", minute: "2-digit" } : spanDays > 400 ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "short" });
  const lf = labelFormat ?? ((t: number) => new Date(t).toLocaleString("pt-BR", spanDays <= 7 ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", year: "numeric" }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RAreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          {showAxis && (
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={tickFmt}
              tick={{ fill: "#667085", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={48}
            />
          )}
          {showAxis && (
            <YAxis
              orientation="right"
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => format(v)}
              tick={{ fill: "#667085", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={84}
            />
          )}
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
            content={(p) => <ChartTooltip {...(p as object)} format={format} labelFormat={lf} />}
          />
          {compareKey && (
            <Area
              type="monotone"
              dataKey={compareKey}
              name={compareLabel}
              stroke="#98A2B3"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              fill="transparent"
              isAnimationActive={!reduce}
              animationDuration={700}
              dot={false}
            />
          )}
          <Area
            type={curve}
            dataKey={dataKey}
            name={mainLabel}
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#g-${id})`}
            isAnimationActive={!reduce}
            animationDuration={900}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0, fill: color }}
          />
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLineChart({
  data,
  lines,
  height = 280,
  format,
  xFormat,
}: {
  data: Record<string, number>[];
  lines: { key: string; label: string; color: string; dashed?: boolean }[];
  height?: number;
  format: (v: number) => string;
  xFormat: (x: number) => string;
}) {
  const reduce = useReducedMotion();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="x" tickFormatter={xFormat} tick={{ fill: "#667085", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={32} />
          <YAxis orientation="right" tickFormatter={format} tick={{ fill: "#667085", fontSize: 11 }} axisLine={false} tickLine={false} width={84} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
            content={(p) => <ChartTooltip {...(p as object)} format={format} labelFormat={xFormat} />}
          />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={l.dashed ? 1.25 : 1.75}
              strokeDasharray={l.dashed ? "4 3" : undefined}
              dot={false}
              isAnimationActive={!reduce}
              animationDuration={800}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tons de cinza e branco para categorias — verde/vermelho ficam reservados para alta/queda. */
export const CATEGORY_COLORS = ["#F5F7FA", "#B8C0CC", "#8A94A3", "#5F6977", "#434B57", "#2F353F", "#D8DEE6"];

export function Donut({ data, size = 156 }: { data: { name: string; value: number }[]; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={!reduce}
            animationDuration={800}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
    </div>
  );
}

/** Sparkline sem eixos, em SVG puro (leve para listas). */
export function Sparkline({ points, width = 88, height = 28, className }: { points: number[]; width?: number; height?: number; className?: string }) {
  if (points.length < 2) return <div style={{ width, height }} className={className} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * width).toFixed(1)},${(height - 2 - ((p - min) / span) * (height - 4)).toFixed(1)}`)
    .join(" ");
  const color = points.at(-1)! >= points[0] ? UP : DOWN;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
