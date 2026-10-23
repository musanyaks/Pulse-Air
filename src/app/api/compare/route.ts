import { NextResponse } from "next/server";
import { getHistory, getLatestReading, getLocationBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const a = searchParams.get("a");
  const b = searchParams.get("b");
  const hours = Math.min(720, Math.max(1, parseInt(searchParams.get("hours") ?? "168", 10)));

  if (!a || !b) {
    return NextResponse.json({ error: "Missing city slugs" }, { status: 400 });
  }

  const [locA, locB] = await Promise.all([getLocationBySlug(a), getLocationBySlug(b)]);
  if (!locA || !locB) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const [latestA, historyA, latestB, historyB] = await Promise.all([
    getLatestReading(locA.id),
    getHistory(locA.id, hours),
    getLatestReading(locB.id),
    getHistory(locB.id, hours),
  ]);

  const avgA = historyA.length
    ? historyA.reduce((sum, r) => sum + r.aqi, 0) / historyA.length
    : latestA?.aqi ?? 0;
  const avgB = historyB.length
    ? historyB.reduce((sum, r) => sum + r.aqi, 0) / historyB.length
    : latestB?.aqi ?? 0;

  return NextResponse.json({
    a: { location: locA, latest: latestA, averageAqi: Math.round(avgA), history: historyA },
    b: { location: locB, latest: latestB, averageAqi: Math.round(avgB), history: historyB },
    delta: {
      aqi: (latestA?.aqi ?? 0) - (latestB?.aqi ?? 0),
      average: Math.round(avgA - avgB),
    },
  });
}
