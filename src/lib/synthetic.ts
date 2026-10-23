import { calculateOverallAQI, getAQIAdvice } from "./aqi";
import type { HourlyParsed } from "./data";
import type { PollutantCode } from "./types";

// Deterministic-ish synthetic air quality generator.
// Produces realistic diurnal and day-to-day variation without any external API.

interface LocationProfile {
  baseAqi: number;
  amplitude: number;
  rushHours: number[];
  pollutantBias: PollutantCode;
}

const PROFILES: Record<string, LocationProfile> = {
  nairobi: { baseAqi: 95, amplitude: 45, rushHours: [7, 8, 17, 18], pollutantBias: "pm25" },
  mombasa: { baseAqi: 70, amplitude: 30, rushHours: [7, 8, 18, 19], pollutantBias: "pm10" },
  kisumu: { baseAqi: 85, amplitude: 40, rushHours: [6, 7, 17, 18], pollutantBias: "pm25" },
  nakuru: { baseAqi: 60, amplitude: 25, rushHours: [7, 8], pollutantBias: "o3" },
  eldoret: { baseAqi: 55, amplitude: 20, rushHours: [8, 18], pollutantBias: "pm10" },
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getProfile(slug: string): LocationProfile {
  return PROFILES[slug] ?? { baseAqi: 70, amplitude: 30, rushHours: [7, 8, 17, 18], pollutantBias: "pm25" };
}

export function generateSyntheticHourly(
  slug: string,
  start: Date,
  end: Date,
  forecast = false
): HourlyParsed[] {
  const profile = getProfile(slug);
  const results: HourlyParsed[] = [];

  const cursor = new Date(start);
  cursor.setMinutes(0, 0, 0);

  let hourIndex = 0;
  while (cursor <= end) {
    const hour = cursor.getUTCHours();
    const daySeed = cursor.getUTCFullYear() * 10000 + (cursor.getUTCMonth() + 1) * 100 + cursor.getUTCDate();
    const baseNoise = pseudoRandom(daySeed + hourIndex) - 0.5;
    const rushBoost = profile.rushHours.includes(hour) ? 18 : 0;
    const diurnal = Math.sin((hour - 4) / 12 * Math.PI) * 8;

    let aqi = Math.round(
      profile.baseAqi + baseNoise * profile.amplitude + rushBoost + diurnal
    );
    aqi = Math.max(10, Math.min(350, aqi));

    const pollutants = derivePollutantsFromAqi(aqi, profile.pollutantBias, hourIndex);
    const { aqi: computedAqi, dominantPollutant } = calculateOverallAQI(pollutants);

    results.push({
      time: cursor.toISOString(),
      pm25: pollutants.pm25,
      pm10: pollutants.pm10,
      o3: pollutants.o3,
      no2: pollutants.no2,
      so2: pollutants.so2,
      co: pollutants.co,
      aqi: computedAqi || aqi,
      dominantPollutant,
      category: getCategory(computedAqi || aqi),
      healthAdvice: getAQIAdvice(computedAqi || aqi),
    });

    cursor.setHours(cursor.getHours() + 1);
    hourIndex++;
  }

  if (forecast && results.length > 0) {
    // Slightly drift the forecast upward to simulate uncertainty
    results.forEach((r, i) => {
      const drift = Math.round((i / results.length) * 15);
      r.aqi = Math.min(350, r.aqi + drift);
      const repollutants = derivePollutantsFromAqi(r.aqi, profile.pollutantBias, hourIndex + i);
      const { aqi, dominantPollutant } = calculateOverallAQI(repollutants);
      r.pm25 = repollutants.pm25;
      r.pm10 = repollutants.pm10;
      r.o3 = repollutants.o3;
      r.no2 = repollutants.no2;
      r.so2 = repollutants.so2;
      r.co = repollutants.co;
      r.aqi = aqi || r.aqi;
      r.dominantPollutant = dominantPollutant;
      r.category = getCategory(r.aqi);
      r.healthAdvice = getAQIAdvice(r.aqi);
    });
  }

  return results;
}

function derivePollutantsFromAqi(
  aqi: number,
  bias: PollutantCode,
  seed: number
): Record<PollutantCode, number> {
  const r = () => 0.85 + pseudoRandom(seed++) * 0.3;

  const pm25 = Math.max(3, (aqi * 0.45 + 5) * r());
  const pm10 = Math.max(5, (aqi * 0.55 + 10) * r());
  const o3 = Math.max(10, (aqi * 0.6 + 15) * r());
  const no2 = Math.max(2, (aqi * 0.25 + 3) * r());
  const so2 = Math.max(1, (aqi * 0.12 + 1) * r());
  const co = Math.max(0.1, (aqi * 0.004 + 0.05) * r());

  const values: Record<PollutantCode, number> = { pm25, pm10, o3, no2, so2, co };

  // Boost the biased pollutant so it often becomes dominant
  values[bias] *= 1.25;

  return {
    pm25: parseFloat(values.pm25.toFixed(1)),
    pm10: parseFloat(values.pm10.toFixed(1)),
    o3: parseFloat(values.o3.toFixed(1)),
    no2: parseFloat(values.no2.toFixed(1)),
    so2: parseFloat(values.so2.toFixed(1)),
    co: parseFloat(values.co.toFixed(3)),
  };
}

function getCategory(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
