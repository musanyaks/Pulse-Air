"use client";

import { Wind, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "alerts", label: "Alerts" },
  { id: "compare", label: "Compare" },
];

export function Header({ activeTab, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
            <Wind className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Pulse Air</h1>
            <p className="hidden text-[10px] uppercase tracking-wider text-slate-500 sm:block">
              Live Air Quality Intelligence
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1 sm:flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300 sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onChange(tab.id);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm font-medium",
                  activeTab === tab.id ? "bg-slate-100 text-slate-900" : "text-slate-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
