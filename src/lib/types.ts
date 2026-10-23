export type PollutantCode = "pm25" | "pm10" | "o3" | "no2" | "so2" | "co";

export interface PollutantReading {
  value: number | null;
  unit: string;
  aqi: number | null;
}

export interface AirReading {
  id?: number;
  locationId: number;
  measuredAt: string;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  aqi: number;
  dominantPollutant: PollutantCode | null;
  category: AQICategory;
  healthAdvice: string;
  forecast: boolean;
}

export interface LocationSummary {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  latest: AirReading | null;
  trend: "up" | "down" | "stable" | null;
}

export interface AQIBand {
  min: number;
  max: number;
  category: AQICategory;
  color: string;
  textColor: string;
  advice: string;
  sensitiveGroups: string;
}

export type AQICategory =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export interface TimeRange {
  label: string;
  value: number; // hours
}

export interface ForecastPoint {
  time: string;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
}

export interface AlertRuleInput {
  locationId: number | null;
  name: string;
  email?: string;
  metric: PollutantCode | "aqi";
  operator: "gt" | "gte" | "lt" | "lte";
  threshold: number;
  cooldownMinutes: number;
}
