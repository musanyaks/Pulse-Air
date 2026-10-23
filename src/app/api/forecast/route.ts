import { NextResponse } from "next/server";
import { getForecast, getLocationBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const location = await getLocationBySlug(slug);
  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const forecast = await getForecast(location.id);
  return NextResponse.json({ location: { id: location.id, slug: location.slug, name: location.name }, forecast });
}
