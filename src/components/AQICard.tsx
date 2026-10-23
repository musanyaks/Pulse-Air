"use client";

import type { AirReading, LocationSummary } from "@/lib/types";
import { getAQIColor, getAQITextColor } from "@/lib/aqi";
import { cn, formatDateTime, trendLabel, classForTrend } from "@/lib/utils";
import { AQIBadge } from "./AQIBadge";
import { Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  location: LocationSummary;
  selected?: boolean;
  onClick?: () => void;
}

export function AQICard({ location, selected, onClick }: Props) {
  const reading = location.latest;
  const aqi = reading?.aqi ?? 0;
  const bg = getAQIColor(aqi);
  const text = getAQITextColor(aqi);
  const trend = location.trend;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.01] hover:border-slate-500",
        selected ? "border-sky-500 ring-1 ring-sky-500/40" : "border-slate-700/60 bg-slate-900/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{location.name}</h3>
          <p className="text-xs text-slate-400">{location.country}</p>
        </div>
        <AQIBadge aqi={aqi} size="lg" />
      </div>

      {reading && (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: bg, color: text }}
            >
              {reading.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <TrendIcon className={cn("h-3.5 w-3.5", classForTrend(trend))} />
              {trendLabel(trend)}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-slate-300">{reading.healthAdvice}</p>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {reading.dominantPollutant?.toUpperCase() ?? "—"}
            </span>
            <span>{formatDateTime(reading.measuredAt, location.timezone)}</span>
          </div>
        </>
      )}
    </button>
  );
}
