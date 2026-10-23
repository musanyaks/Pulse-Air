import { format, parseISO } from "date-fns";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDateTime(iso: string, tz?: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz || "UTC",
    }).format(parseISO(iso));
  } catch {
    return format(parseISO(iso), "MMM d, h:mm a");
  }
}

export function formatShortDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function formatHour(iso: string): string {
  try {
    return format(parseISO(iso), "h a");
  } catch {
    return iso;
  }
}

export function classForTrend(trend: "up" | "down" | "stable" | null): string {
  switch (trend) {
    case "up":
      return "text-rose-500";
    case "down":
      return "text-emerald-500";
    case "stable":
      return "text-slate-400";
    default:
      return "text-slate-400";
  }
}

export function trendLabel(trend: "up" | "down" | "stable" | null): string {
  switch (trend) {
    case "up":
      return "Rising";
    case "down":
      return "Falling";
    case "stable":
      return "Stable";
    default:
      return "—";
  }
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
