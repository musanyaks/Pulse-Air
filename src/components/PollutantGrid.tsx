"use client";

import type { AirReading } from "@/lib/types";
import { POLLUTANT_META } from "@/lib/constants";
import { calculatePollutantAQI, getAQIColor } from "@/lib/aqi";
import { cn } from "@/lib/utils";

interface Props {
  reading: AirReading;
}

const KEYS = ["pm25", "pm10", "o3", "no2", "so2", "co"] as const;

export function PollutantGrid({ reading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {KEYS.map((key) => {
        const value = reading[key as keyof AirReading] as number | null;
        const meta = POLLUTANT_META[key];
        const aqi = calculatePollutantAQI(key, value);
        const color = aqi != null ? getAQIColor(aqi) : "#334155";
        const isDominant = reading.dominantPollutant === key;

        return (
          <div
            key={key}
            className={cn(
              "relative rounded-xl border bg-slate-900/60 p-3 transition-colors",
              isDominant ? "border-amber-500/50" : "border-slate-700/60"
            )}
          >
            {isDominant && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            )}
            <p className="text-xs font-medium text-slate-400">{meta.label}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-100">
                {value != null ? value.toFixed(key === "co" ? 2 : 1) : "—"}
              </span>
              <span className="text-[10px] text-slate-500">{meta.unit}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (aqi ?? 0) / 5)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                {aqi ?? "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
