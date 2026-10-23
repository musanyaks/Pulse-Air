import { NextResponse } from "next/server";
import { getHistory, getLatestReading, getLocationBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const hours = Math.min(2160, Math.max(1, parseInt(searchParams.get("hours") ?? "168", 10)));
  const forecast = searchParams.get("forecast") === "true";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const location = await getLocationBySlug(slug);
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const [latest, history] = await Promise.all([
    getLatestReading(location.id),
    getHistory(location.id, hours, forecast),
  ]);

  return NextResponse.json({
    location: {
      id: location.id,
      slug: location.slug,
      name: location.name,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    },
    latest,
    history,
  });
}
