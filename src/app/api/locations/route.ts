import { NextResponse } from "next/server";
import { getLocations } from "@/lib/data";
import { seedLocations } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await seedLocations();
  const locations = await getLocations();
  return NextResponse.json({ locations });
}
