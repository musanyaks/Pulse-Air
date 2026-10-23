import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { upsertReadings } from "./data";
import { seedLocations } from "./seed";
import { generateSyntheticHourly } from "./synthetic";

export async function ingestAll() {
  await seedLocations();
  const locs = await db.select().from(locations).where(eq(locations.isActive, true));

  const results: { locationId: number; name: string; inserted: number; forecast: number }[] = [];
  const now = new Date();

  for (const loc of locs) {
    try {
      const historyStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const historyEnd = now;
      const forecastStart = now;
      const forecastEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      const historicalParsed = generateSyntheticHourly(loc.slug, historyStart, historyEnd, false);
      const forecastParsed = generateSyntheticHourly(loc.slug, forecastStart, forecastEnd, true);

      await upsertReadings(loc.id, historicalParsed, false);
      await upsertReadings(loc.id, forecastParsed, true);

      results.push({
        locationId: loc.id,
        name: loc.name,
        inserted: historicalParsed.length,
        forecast: forecastParsed.length,
      });
    } catch (err) {
      results.push({
        locationId: loc.id,
        name: loc.name,
        inserted: -1,
        forecast: 0,
      });
    }
  }

  return results;
}
