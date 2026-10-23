"use client";

import { MapPin, Activity, Bell } from "lucide-react";

interface Props {
  stats: { locations: number; readings: number; alerts: number } | null;
}

export function StatCards({ stats }: Props) {
  const cards = [
    { icon: MapPin, label: "Monitored Locations", value: stats?.locations ?? "—" },
    { icon: Activity, label: "Total Readings", value: stats?.readings ?? "—" },
    { icon: Bell, label: "Active Alerts", value: stats?.alerts ?? "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3 text-center sm:p-4"
        >
          <c.icon className="mx-auto h-4 w-4 text-sky-400 sm:h-5 sm:w-5" />
          <p className="mt-1 text-lg font-bold text-slate-100 sm:text-2xl">{c.value}</p>
          <p className="text-[10px] text-slate-500 sm:text-xs">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
