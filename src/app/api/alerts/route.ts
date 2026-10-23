import { NextResponse } from "next/server";
import {
  createAlertConfig,
  createAlertLog,
  deleteAlertConfig,
  getActiveAlertConfigs,
  getAlertConfigs,
  getLatestReading,
  getLocationById,
  getRecentAlertLogs,
} from "@/lib/data";
import { z } from "zod";

const createSchema = z.object({
  locationId: z.number().nullable(),
  name: z.string().min(1).max(128),
  email: z.string().email().optional(),
  metric: z.enum(["aqi", "pm25", "pm10", "o3", "no2", "so2", "co"]),
  operator: z.enum(["gt", "gte", "lt", "lte"]),
  threshold: z.number(),
  cooldownMinutes: z.number().min(5).max(10080).default(60),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const [configs, logs] = await Promise.all([getAlertConfigs(), getRecentAlertLogs(20)]);
  return NextResponse.json({ configs, logs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const config = await createAlertConfig(parsed);

    // Immediately evaluate against current readings if a location is specified
    if (config.locationId) {
      await evaluateAlert(config);
    }

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid alert payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "", 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await deleteAlertConfig(id);
  return NextResponse.json({ ok: true });
}

async function evaluateAlert(config: Awaited<ReturnType<typeof createAlertConfig>>) {
  if (!config.locationId) return;
  const reading = await getLatestReading(config.locationId);
  if (!reading) return;

  const observed =
    config.metric === "aqi" ? reading.aqi : (reading[config.metric as keyof typeof reading] as number | null);
  if (observed == null) return;

  let triggered = false;
  switch (config.operator) {
    case "gt":
      triggered = observed > config.threshold;
      break;
    case "gte":
      triggered = observed >= config.threshold;
      break;
    case "lt":
      triggered = observed < config.threshold;
      break;
    case "lte":
      triggered = observed <= config.threshold;
      break;
  }

  if (!triggered) return;

  const location = await getLocationById(config.locationId);
  const locationName = location?.name ?? "Unknown";
  const metricLabel = config.metric.toUpperCase();
  const message = `${metricLabel} in ${locationName} is ${observed} (${config.operator} ${config.threshold}).`;

  await createAlertLog({
    alertId: config.id,
    locationId: config.locationId,
    metric: config.metric,
    threshold: config.threshold,
    observedValue: observed,
    message,
  });
}
