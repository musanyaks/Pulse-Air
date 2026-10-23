import { AQI_BANDS } from "./constants";
import type { AQICategory, PollutantCode } from "./types";

// EPA-style breakpoints (concentration in µg/m³ except CO in mg/m³)
interface Breakpoint {
  minC: number;
  maxC: number;
  minI: number;
  maxI: number;
}

const BREAKPOINTS: Record<Exclude<PollutantCode, "co">, Breakpoint[]> = {
  pm25: [
    { minC: 0, maxC: 12.0, minI: 0, maxI: 50 },
    { minC: 12.1, maxC: 35.4, minI: 51, maxI: 100 },
    { minC: 35.5, maxC: 55.4, minI: 101, maxI: 150 },
    { minC: 55.5, maxC: 150.4, minI: 151, maxI: 200 },
    { minC: 150.5, maxC: 250.4, minI: 201, maxI: 300 },
    { minC: 250.5, maxC: 500.4, minI: 301, maxI: 500 },
  ],
  pm10: [
    { minC: 0, maxC: 54, minI: 0, maxI: 50 },
    { minC: 55, maxC: 154, minI: 51, maxI: 100 },
    { minC: 155, maxC: 254, minI: 101, maxI: 150 },
    { minC: 255, maxC: 354, minI: 151, maxI: 200 },
    { minC: 355, maxC: 424, minI: 201, maxI: 300 },
    { minC: 425, maxC: 604, minI: 301, maxI: 500 },
  ],
  o3: [
    { minC: 0, maxC: 54, minI: 0, maxI: 50 },
    { minC: 55, maxC: 70, minI: 51, maxI: 100 },
    { minC: 71, maxC: 85, minI: 101, maxI: 150 },
    { minC: 86, maxC: 105, minI: 151, maxI: 200 },
    { minC: 106, maxC: 200, minI: 201, maxI: 300 },
    { minC: 201, maxC: 600, minI: 301, maxI: 500 },
  ],
  no2: [
    { minC: 0, maxC: 53, minI: 0, maxI: 50 },
    { minC: 54, maxC: 100, minI: 51, maxI: 100 },
    { minC: 101, maxC: 360, minI: 101, maxI: 150 },
    { minC: 361, maxC: 649, minI: 151, maxI: 200 },
    { minC: 650, maxC: 1249, minI: 201, maxI: 300 },
    { minC: 1250, maxC: 2049, minI: 301, maxI: 500 },
  ],
  so2: [
    { minC: 0, maxC: 35, minI: 0, maxI: 50 },
    { minC: 36, maxC: 75, minI: 51, maxI: 100 },
    { minC: 76, maxC: 185, minI: 101, maxI: 150 },
    { minC: 186, maxC: 304, minI: 151, maxI: 200 },
    { minC: 305, maxC: 604, minI: 201, maxI: 300 },
    { minC: 605, maxC: 1004, minI: 301, maxI: 500 },
  ],
};

const CO_BREAKPOINTS: Breakpoint[] = [
  { minC: 0, maxC: 4.4, minI: 0, maxI: 50 },
  { minC: 4.5, maxC: 9.4, minI: 51, maxI: 100 },
  { minC: 9.5, maxC: 12.4, minI: 101, maxI: 150 },
  { minC: 12.5, maxC: 15.4, minI: 151, maxI: 200 },
  { minC: 15.5, maxC: 30.4, minI: 201, maxI: 300 },
  { minC: 30.5, maxC: 50.4, minI: 301, maxI: 500 },
];

export function calculatePollutantAQI(
  pollutant: PollutantCode,
  concentration: number | null | undefined
): number | null {
  if (concentration == null || Number.isNaN(concentration)) return null;

  const breakpoints = pollutant === "co" ? CO_BREAKPOINTS : BREAKPOINTS[pollutant];
  const bp = breakpoints.find((b) => concentration >= b.minC && concentration <= b.maxC);
  if (!bp) {
    // Exceeds highest breakpoint
    const last = breakpoints[breakpoints.length - 1];
    if (concentration > last.maxC) {
      return Math.min(500, Math.round(((concentration - last.minC) / (last.maxC - last.minC)) * (last.maxI - last.minI) + last.minI));
    }
    return 0;
  }

  const aqi =
    ((bp.maxI - bp.minI) / (bp.maxC - bp.minC)) * (concentration - bp.minC) + bp.minI;
  return Math.round(aqi);
}

export function calculateOverallAQI(pollutants: Partial<Record<PollutantCode, number | null>>): {
  aqi: number;
  dominantPollutant: PollutantCode | null;
} {
  let maxAqi = 0;
  let dominant: PollutantCode | null = null;

  (Object.keys(pollutants) as PollutantCode[]).forEach((key) => {
    const val = pollutants[key];
    if (val == null) return;
    const aqi = calculatePollutantAQI(key, val);
    if (aqi != null && aqi > maxAqi) {
      maxAqi = aqi;
      dominant = key;
    }
  });

  return { aqi: maxAqi, dominantPollutant: dominant };
}

export function getAQIBand(aqi: number): AQICategory {
  const band = AQI_BANDS.find((b) => aqi >= b.min && aqi <= b.max);
  return band?.category ?? "Hazardous";
}

export function getAQIAdvice(aqi: number): string {
  const band = AQI_BANDS.find((b) => aqi >= b.min && aqi <= b.max);
  return band?.advice ?? AQI_BANDS[AQI_BANDS.length - 1].advice;
}

export function getAQIColor(aqi: number): string {
  const band = AQI_BANDS.find((b) => aqi >= b.min && aqi <= b.max);
  return band?.color ?? AQI_BANDS[AQI_BANDS.length - 1].color;
}

export function getAQITextColor(aqi: number): string {
  const band = AQI_BANDS.find((b) => aqi >= b.min && aqi <= b.max);
  return band?.textColor ?? AQI_BANDS[AQI_BANDS.length - 1].textColor;
}
