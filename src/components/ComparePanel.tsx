"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendChart } from "./TrendChart";
import { AQIBadge } from "./AQIBadge";
import { getAQIColor, getAQITextColor } from "@/lib/aqi";
import { cn } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";

interface Props {
  locations: { id: number; name: string; slug: string }[];
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to compare");
  return res.json();
}

export function ComparePanel({ locations }: Props) {
  const [a, setA] = useState(locations[0]?.slug ?? "nairobi");
  const [b, setB] = useState(locations[1]?.slug ?? "mombasa");
  const [hours, setHours] = useState(168);

  const { data, isLoading } = useSWR(
    a && b ? `/api/compare?a=${a}&b=${b}&hours=${hours}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  function swap() {
    setA(b);
    setB(a);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">City Comparison</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <select
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
          >
            {locations.map((loc) => (
              <option key={loc.slug} value={loc.slug}>
                {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={swap}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          <select
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
          >
            {locations.map((loc) => (
              <option key={loc.slug} value={loc.slug}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 sm:w-40"
          >
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
            <option value={720}>Last 30 days</option>
          </select>
        </div>
      </section>

      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-900/40" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <CompareCard label={data.a.location.name} data={data.a} />
            <CompareCard label={data.b.location.name} data={data.b} />
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Combined Trend</h3>
            <TrendChart
              history={data.a.history.map((r: { measuredAt: string; aqi: number }) => ({ ...r, forecast: false }))}
              forecast={data.b.history.map((r: { measuredAt: string; aqi: number }) => ({ ...r, forecast: true }))}
              height={300}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CompareCard({ label, data }: { label: string; data: { latest: { aqi: number; category: string }; averageAqi: number } }) {
  const bg = getAQIColor(data.latest?.aqi ?? 0);
  const color = getAQITextColor(data.latest?.aqi ?? 0);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">{label}</h3>
        <AQIBadge aqi={data.latest?.aqi ?? 0} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: bg, color }}>
          {data.latest?.category}
        </span>
        <span className="text-xs text-slate-400">Avg AQI {data.averageAqi}</span>
      </div>
    </div>
  );
}
