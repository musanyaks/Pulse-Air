"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/Header";
import { AQICard } from "@/components/AQICard";
import { MapView } from "@/components/MapView";
import { PollutantGrid } from "@/components/PollutantGrid";
import { TrendChart } from "@/components/TrendChart";
import { ForecastStrip } from "@/components/ForecastStrip";
import { AlertsPanel } from "@/components/AlertsPanel";
import { ComparePanel } from "@/components/ComparePanel";
import { StatCards } from "@/components/StatCards";
import { AQIBadge } from "@/components/AQIBadge";
import { TIME_RANGES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { getAQIColor, getAQITextColor } from "@/lib/aqi";
import type { LocationSummary, AirReading } from "@/lib/types";
import { Loader2, RefreshCw } from "lucide-react";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>();
  const [hours, setHours] = useState(168);

  const { data: locationsData, mutate: mutateLocations } = useSWR("/api/locations", fetcher, {
    refreshInterval: 60000,
  });
  const { data: statsData } = useSWR("/api/stats", fetcher, { refreshInterval: 60000 });

  const locations: LocationSummary[] = useMemo(() => locationsData?.locations ?? [], [locationsData]);
  const selectedLocation = useMemo(
    () => locations.find((l) => l.slug === selectedSlug) ?? locations[0] ?? null,
    [locations, selectedSlug]
  );

  const { data: readingData, isLoading: readingLoading } = useSWR(
    selectedLocation ? `/api/readings?slug=${selectedLocation.slug}&hours=${hours}` : null,
    fetcher,
    { refreshInterval: 300000 }
  );

  const { data: forecastData, isLoading: forecastLoading } = useSWR(
    selectedLocation ? `/api/forecast?slug=${selectedLocation.slug}` : null,
    fetcher,
    { refreshInterval: 600000 }
  );

  async function runIngest() {
    await fetch("/api/ingest");
    mutateLocations();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header activeTab={activeTab} onChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Environment Intelligence</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl">
              {activeTab === "dashboard" && "Air Quality Dashboard"}
              {activeTab === "alerts" && "Threshold Alerts"}
              {activeTab === "compare" && "Compare Cities"}
            </h1>
          </div>
          <button
            onClick={runIngest}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:border-sky-500 hover:text-sky-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>

        <StatCards stats={statsData?.stats ?? null} />

        {activeTab === "dashboard" && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Locations sidebar */}
            <div className="space-y-3 lg:col-span-4 xl:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Locations</h2>
                <span className="text-xs text-slate-500">{locations.length} cities</span>
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {locations.map((loc) => (
                  <AQICard
                    key={loc.slug}
                    location={loc}
                    selected={loc.slug === selectedLocation?.slug}
                    onClick={() => setSelectedSlug(loc.slug)}
                  />
                ))}
              </div>
            </div>

            {/* Main panel */}
            <div className="space-y-6 lg:col-span-8 xl:col-span-9">
              <MapView
                locations={locations}
                selectedSlug={selectedLocation?.slug}
                onSelect={setSelectedSlug}
              />

              {selectedLocation && readingData?.latest && (
                <HeroReading location={selectedLocation} reading={readingData.latest} />
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Historical Trend</h3>
                <div className="flex gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1">
                  {TIME_RANGES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setHours(r.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        hours === r.value ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {readingLoading ? (
                <LoadingBlock />
              ) : (
                <TrendChart history={readingData?.history ?? []} forecast={forecastData?.forecast ?? []} />
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {readingLoading || !readingData?.latest ? (
                  <LoadingBlock className="md:col-span-2" />
                ) : (
                  <>
                    <PollutantGrid reading={readingData.latest} />
                    <ForecastStrip forecast={forecastData?.forecast ?? []} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="mt-6">
            <AlertsPanel
              locations={locations.map((l) => ({ id: l.id, name: l.name, slug: l.slug }))}
            />
          </div>
        )}

        {activeTab === "compare" && (
          <div className="mt-6">
            <ComparePanel
              locations={locations.map((l) => ({ id: l.id, name: l.name, slug: l.slug }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function HeroReading({ location, reading }: { location: LocationSummary; reading: AirReading }) {
  const bg = getAQIColor(reading.aqi);
  const color = getAQITextColor(reading.aqi);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: bg, opacity: 0.2 }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Current Conditions</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-100">{location.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Updated {formatDateTime(reading.measuredAt, location.timezone)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400">US AQI</p>
            <p className="text-4xl font-bold text-slate-100">{reading.aqi}</p>
          </div>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg"
            style={{ backgroundColor: bg, color }}
          >
            {reading.aqi}
          </div>
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: bg, color }}>
          {reading.category}
        </span>
        <span className="text-sm text-slate-300">{reading.healthAdvice}</span>
      </div>
    </div>
  );
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    </div>
  );
}
