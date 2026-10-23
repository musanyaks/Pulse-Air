"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { AirReading } from "@/lib/types";
import { formatHour, formatShortDate } from "@/lib/utils";
import { AQI_BANDS } from "@/lib/constants";

interface ChartPoint {
  time: string;
  aqi: number;
  type: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400">{label ? new Date(label).toLocaleString() : ""}</p>
        <p className="mt-1 font-semibold text-slate-100">AQI {payload[0].value}</p>
      </div>
    );
  }
  return null;
}

interface Props {
  history: AirReading[];
  forecast?: AirReading[];
  height?: number;
}

export function TrendChart({ history, forecast = [], height = 320 }: Props) {
  const historyPoints = history.map((r) => ({
    time: r.measuredAt,
    aqi: r.aqi,
    type: "history",
  }));

  const forecastPoints = forecast.map((r) => ({
    time: r.measuredAt,
    aqi: r.aqi,
    type: "forecast",
  }));

  const data = [...historyPoints, ...forecastPoints];

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">
        No historical data yet.
      </div>
    );
  }

  const latestHistory = history[history.length - 1]?.aqi ?? 0;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
      <div className="mb-2 flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Historical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Forecast
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return data.length > 48 ? formatShortDate(v) : formatHour(v);
            }}
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 11 }}
            domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 50) * 50)]}
          />
          {AQI_BANDS.slice(0, -1).map((band) => (
            <ReferenceLine
              key={band.min}
              y={band.max}
              stroke={band.color}
              strokeDasharray="4 4"
              strokeOpacity={0.35}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#aqiGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#38bdf8" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
