"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Bell, Plus, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertRuleInput } from "@/lib/types";

const METRICS = ["aqi", "pm25", "pm10", "o3", "no2", "so2", "co"] as const;
const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
] as const;

interface Props {
  locations: { id: number; name: string; slug: string }[];
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export function AlertsPanel({ locations }: Props) {
  const { data, error, isLoading } = useSWR("/api/alerts", fetcher, { refreshInterval: 30000 });
  const [form, setForm] = useState<AlertRuleInput>({
    locationId: locations[0]?.id ?? null,
    name: "",
    email: "",
    metric: "aqi",
    operator: "gt",
    threshold: 100,
    cooldownMinutes: 60,
  });
  const [saving, setSaving] = useState(false);

  const configs = data?.configs ?? [];
  const logs = data?.logs ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create alert");
      await mutate("/api/alerts");
      setForm({ ...form, name: "", email: "", threshold: 100 });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    await mutate("/api/alerts");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-slate-100">Alert Rules</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Rule name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                placeholder="e.g. Unhealthy AQI threshold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Location</label>
              <select
                value={form.locationId ?? ""}
                onChange={(e) => setForm({ ...form, locationId: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Metric</label>
              <select
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value as AlertRuleInput["metric"] })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Operator</label>
              <select
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value as AlertRuleInput["operator"] })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              >
                {OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Threshold</label>
              <input
                type="number"
                required
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Cooldown (min)</label>
              <input
                type="number"
                min={5}
                value={form.cooldownMinutes}
                onChange={(e) => setForm({ ...form, cooldownMinutes: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Creating..." : "Create Alert"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Active Rules</h3>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="text-sm text-slate-500">No alert rules configured.</p>
        ) : (
          <div className="space-y-2">
            {configs.map((cfg: { id: number; name: string; metric: string; operator: string; threshold: number; isActive: boolean }) => (
              <div
                key={cfg.id}
                className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-900/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{cfg.name}</p>
                  <p className="text-xs text-slate-500">
                    {cfg.metric.toUpperCase()} {OPERATORS.find((o) => o.value === cfg.operator)?.label ?? cfg.operator}{" "}
                    {cfg.threshold}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(cfg.id)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/30 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-200">Recent Triggers</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No alerts triggered yet.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {logs.map((log: { id: number; message: string; createdAt: string; observedValue: number }) => (
              <div
                key={log.id}
                className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3"
              >
                <p className="text-sm text-amber-100">{log.message}</p>
                <p className="mt-1 text-xs text-amber-500/80">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
