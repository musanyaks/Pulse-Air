import { db } from "@/db";
import { locations, readings, alertConfigs, alertLogs } from "@/db/schema";
import { and, eq, gte, desc, lte, sql, inArray, isNull, or } from "drizzle-orm";
import type { AirReading, LocationSummary } from "./types";
import { calculateOverallAQI, getAQIAdvice, getAQIBand } from "./aqi";
import type { PollutantCode } from "./types";

export function readingFromRow(row: typeof readings.$inferSelect): AirReading {
  return {
    id: row.id,
    locationId: row.locationId,
    measuredAt: row.measuredAt.toISOString(),
    pm25: row.pm25,
    pm10: row.pm10,
    o3: row.o3,
    no2: row.no2,
    so2: row.so2,
    co: row.co,
    aqi: row.aqi ?? 0,
    dominantPollutant: (row.dominantPollutant as AirReading["dominantPollutant"]) ?? null,
    category: (row.category as AirReading["category"]) ?? "Good",
    healthAdvice: row.healthAdvice ?? "",
    forecast: row.forecast,
  };
}

export async function getLocations(): Promise<LocationSummary[]> {
  const rows = await db
    .select({
      id: locations.id,
      slug: locations.slug,
      name: locations.name,
      country: locations.country,
      latitude: locations.latitude,
      longitude: locations.longitude,
      timezone: locations.timezone,
      readingId: readings.id,
      measuredAt: readings.measuredAt,
      pm25: readings.pm25,
      pm10: readings.pm10,
      o3: readings.o3,
      no2: readings.no2,
      so2: readings.so2,
      co: readings.co,
      aqi: readings.aqi,
      dominantPollutant: readings.dominantPollutant,
      category: readings.category,
      healthAdvice: readings.healthAdvice,
      forecast: readings.forecast,
    })
    .from(locations)
    .leftJoin(readings, and(eq(readings.locationId, locations.id), eq(readings.forecast, false)))
    .where(eq(locations.isActive, true))
    .orderBy(desc(readings.measuredAt));

  const seen = new Set<number>();
  const summaries: LocationSummary[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    summaries.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone ?? "UTC",
      latest: row.readingId
        ? readingFromRow({
            id: row.readingId,
            locationId: row.id,
            measuredAt: row.measuredAt!,
            pm25: row.pm25,
            pm10: row.pm10,
            o3: row.o3,
            no2: row.no2,
            so2: row.so2,
            co: row.co,
            aqi: row.aqi,
            dominantPollutant: row.dominantPollutant,
            category: row.category,
            healthAdvice: row.healthAdvice,
            forecast: row.forecast ?? false,
            source: "open-meteo",
            raw: null,
            createdAt: row.measuredAt!,
          })
        : null,
      trend: null,
    });
  }

  // Compute trend for each location
  for (const summary of summaries) {
    summary.trend = await getTrend(summary.id);
  }

  return summaries.sort((a, b) => (b.latest?.aqi ?? 0) - (a.latest?.aqi ?? 0));
}

export async function getLocationBySlug(slug: string) {
  const [row] = await db.select().from(locations).where(eq(locations.slug, slug)).limit(1);
  return row ?? null;
}

export async function getLocationById(id: number) {
  const [row] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return row ?? null;
}

export async function getLatestReading(locationId: number): Promise<AirReading | null> {
  const [row] = await db
    .select()
    .from(readings)
    .where(and(eq(readings.locationId, locationId), eq(readings.forecast, false)))
    .orderBy(desc(readings.measuredAt))
    .limit(1);
  return row ? readingFromRow(row) : null;
}

export async function getHistory(
  locationId: number,
  hoursBack: number,
  includeForecast = false
): Promise<AirReading[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const conditions = [eq(readings.locationId, locationId), gte(readings.measuredAt, since)];
  if (!includeForecast) {
    conditions.push(eq(readings.forecast, false));
  }

  const rows = await db
    .select()
    .from(readings)
    .where(and(...conditions))
    .orderBy(readings.measuredAt);

  return rows.map(readingFromRow);
}

export async function getTrend(locationId: number): Promise<"up" | "down" | "stable" | null> {
  const rows = await db
    .select({ aqi: readings.aqi, measuredAt: readings.measuredAt })
    .from(readings)
    .where(and(eq(readings.locationId, locationId), eq(readings.forecast, false)))
    .orderBy(desc(readings.measuredAt))
    .limit(12);

  if (rows.length < 4) return null;

  const recent = rows.slice(0, 4).reduce((sum, r) => sum + (r.aqi ?? 0), 0) / 4;
  const older = rows.slice(rows.length - 4).reduce((sum, r) => sum + (r.aqi ?? 0), 0) / 4;

  const diff = recent - older;
  if (Math.abs(diff) <= 5) return "stable";
  return diff > 0 ? "up" : "down";
}

export async function getForecast(locationId: number): Promise<AirReading[]> {
  const rows = await db
    .select()
    .from(readings)
    .where(and(eq(readings.locationId, locationId), eq(readings.forecast, true)))
    .orderBy(readings.measuredAt);
  return rows.map(readingFromRow);
}

export interface HourlyParsed {
  time: string;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  aqi: number;
  dominantPollutant: PollutantCode | null;
  category: AirReading["category"];
  healthAdvice: string;
}

export async function upsertReadings(
  locationId: number,
  parsed: HourlyParsed[],
  isForecast: boolean
) {
  if (parsed.length === 0) return;

  const values = parsed.map((p) => ({
    locationId,
    measuredAt: new Date(p.time),
    pm25: p.pm25,
    pm10: p.pm10,
    o3: p.o3,
    no2: p.no2,
    so2: p.so2,
    co: p.co,
    aqi: p.aqi,
    dominantPollutant: p.dominantPollutant,
    category: p.category,
    healthAdvice: p.healthAdvice,
    forecast: isForecast,
    source: "open-meteo",
    raw: null,
  }));

  await db
    .insert(readings)
    .values(values)
    .onConflictDoNothing({ target: [readings.locationId, readings.measuredAt, readings.forecast] });
}

export async function getActiveAlertConfigs() {
  return db.select().from(alertConfigs).where(eq(alertConfigs.isActive, true));
}

export async function getAlertConfigs() {
  return db.select().from(alertConfigs).orderBy(desc(alertConfigs.createdAt));
}

export async function createAlertConfig(values: {
  locationId: number | null;
  name: string;
  email?: string;
  metric: string;
  operator: string;
  threshold: number;
  cooldownMinutes: number;
}) {
  const [row] = await db
    .insert(alertConfigs)
    .values({
      locationId: values.locationId,
      name: values.name,
      email: values.email,
      metric: values.metric,
      operator: values.operator,
      threshold: values.threshold,
      cooldownMinutes: values.cooldownMinutes,
    })
    .returning();
  return row;
}

export async function deleteAlertConfig(id: number) {
  await db.delete(alertConfigs).where(eq(alertConfigs.id, id));
}

export async function createAlertLog(values: {
  alertId: number;
  locationId: number | null;
  metric: string;
  threshold: number;
  observedValue: number;
  message: string;
}) {
  const [row] = await db
    .insert(alertLogs)
    .values({
      alertId: values.alertId,
      locationId: values.locationId,
      metric: values.metric,
      threshold: values.threshold,
      observedValue: values.observedValue,
      message: values.message,
    })
    .returning();
  return row;
}

export async function getRecentAlertLogs(limit = 50) {
  return db
    .select({
      id: alertLogs.id,
      alertId: alertLogs.alertId,
      locationId: alertLogs.locationId,
      metric: alertLogs.metric,
      threshold: alertLogs.threshold,
      observedValue: alertLogs.observedValue,
      message: alertLogs.message,
      acknowledged: alertLogs.acknowledged,
      createdAt: alertLogs.createdAt,
      locationName: locations.name,
    })
    .from(alertLogs)
    .leftJoin(locations, eq(locations.id, alertLogs.locationId))
    .orderBy(desc(alertLogs.createdAt))
    .limit(limit);
}

export async function getStats() {
  const [locationCount, readingCount, alertCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(locations),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(readings),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(alertConfigs),
  ]);

  return {
    locations: locationCount[0]?.count ?? 0,
    readings: readingCount[0]?.count ?? 0,
    alerts: alertCount[0]?.count ?? 0,
  };
}
