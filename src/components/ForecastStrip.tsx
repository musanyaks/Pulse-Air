"use client";

import type { AirReading } from "@/lib/types";
import { getAQIColor, getAQITextColor } from "@/lib/aqi";
import { formatShortDate } from "@/lib/utils";

interface Props {
  forecast: AirReading[];
}

export function ForecastStrip({ forecast }: Props) {
  if (forecast.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-500">
        Forecast unavailable.
      </div>
    );
  }

  // Daily max AQI
  const daily: Record<string, AirReading[]> = {};
  forecast.forEach((r) => {
    const day = r.measuredAt.split("T")[0];
    if (!daily[day]) daily[day] = [];
    daily[day].push(r);
  });

  const days = Object.entries(daily)
    .slice(0, 5)
    .map(([date, rs]) => {
      const max = rs.reduce((m, r) => (r.aqi > m.aqi ? r : m), rs[0]);
      return { date, max };
    });

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">5-Day Outlook</h3>
      <div className="grid grid-cols-5 gap-2">
        {days.map((d) => {
          const bg = getAQIColor(d.max.aqi);
          const color = getAQITextColor(d.max.aqi);
          return (
            <div
              key={d.date}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-700/40 bg-slate-900/60 p-2 text-center"
            >
              <span className="text-[10px] uppercase text-slate-500">{formatShortDate(d.date)}</span>
              <span
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: bg, color }}
              >
                {d.max.aqi}
              </span>
              <span className="mt-1 text-[10px] text-slate-400">{d.max.dominantPollutant?.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
