import { db } from "@/db";
import { locations } from "@/db/schema";
import { DEFAULT_LOCATIONS } from "./constants";
import { eq, inArray } from "drizzle-orm";

export async function seedLocations() {
  const slugs = DEFAULT_LOCATIONS.map((l) => l.slug);
  const existing = await db
    .select({ slug: locations.slug })
    .from(locations)
    .where(inArray(locations.slug, slugs));

  const existingSet = new Set(existing.map((e) => e.slug));
  const toInsert = DEFAULT_LOCATIONS.filter((l) => !existingSet.has(l.slug));

  if (toInsert.length === 0) return;

  await db.insert(locations).values(
    toInsert.map((l) => ({
      slug: l.slug,
      name: l.name,
      country: l.country,
      latitude: l.lat,
      longitude: l.lon,
      timezone: l.tz,
      source: "open-meteo",
      isActive: true,
    }))
  );
}
