import type { AQIBand, TimeRange } from "./types";

export const AQI_BANDS: AQIBand[] = [
  {
    min: 0,
    max: 50,
    category: "Good",
    color: "#22c55e",
    textColor: "#14532d",
    advice: "Air quality is satisfactory. Enjoy outdoor activities.",
    sensitiveGroups: "None",
  },
  {
    min: 51,
    max: 100,
    category: "Moderate",
    color: "#eab308",
    textColor: "#713f12",
    advice: "Air quality is acceptable. Sensitive individuals should consider limiting prolonged exertion.",
    sensitiveGroups: "People with respiratory disease, such as asthma",
  },
  {
    min: 101,
    max: 150,
    category: "Unhealthy for Sensitive Groups",
    color: "#f97316",
    textColor: "#7c2d12",
    advice: "Members of sensitive groups may experience health effects. Reduce prolonged outdoor exertion.",
    sensitiveGroups: "Children, older adults, and people with heart or lung disease",
  },
  {
    min: 151,
    max: 200,
    category: "Unhealthy",
    color: "#ef4444",
    textColor: "#7f1d1d",
    advice: "Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.",
    sensitiveGroups: "Everyone, especially sensitive groups",
  },
  {
    min: 201,
    max: 300,
    category: "Very Unhealthy",
    color: "#a855f7",
    textColor: "#581c87",
    advice: "Health alert: everyone may experience more serious health effects. Avoid all outdoor exertion.",
    sensitiveGroups: "Everyone",
  },
  {
    min: 301,
    max: 999,
    category: "Hazardous",
    color: "#7f1d1d",
    textColor: "#fef2f2",
    advice: "Health warnings of emergency conditions. Everyone should avoid all outdoor exertion.",
    sensitiveGroups: "Everyone",
  },
];

export const TIME_RANGES: TimeRange[] = [
  { label: "24H", value: 24 },
  { label: "7D", value: 168 },
  { label: "30D", value: 720 },
  { label: "90D", value: 2160 },
];

export const POLLUTANT_META: Record<
  string,
  { label: string; unit: string; description: string; whoGuideline: number }
> = {
  pm25: {
    label: "PM2.5",
    unit: "µg/m³",
    description: "Fine particulate matter smaller than 2.5 microns",
    whoGuideline: 15,
  },
  pm10: {
    label: "PM10",
    unit: "µg/m³",
    description: "Inhalable particulate matter smaller than 10 microns",
    whoGuideline: 45,
  },
  o3: {
    label: "O₃",
    unit: "µg/m³",
    description: "Ground-level ozone formed by reactions with pollutants",
    whoGuideline: 100,
  },
  no2: {
    label: "NO₂",
    unit: "µg/m³",
    description: "Nitrogen dioxide from combustion sources",
    whoGuideline: 25,
  },
  so2: {
    label: "SO₂",
    unit: "µg/m³",
    description: "Sulfur dioxide from burning fossil fuels",
    whoGuideline: 40,
  },
  co: {
    label: "CO",
    unit: "mg/m³",
    description: "Carbon monoxide from incomplete combustion",
    whoGuideline: 4,
  },
};

export const DEFAULT_LOCATIONS = [
  { slug: "nairobi", name: "Nairobi", country: "Kenya", lat: -1.286389, lon: 36.817223, tz: "Africa/Nairobi" },
  { slug: "mombasa", name: "Mombasa", country: "Kenya", lat: -4.043477, lon: 39.668206, tz: "Africa/Nairobi" },
  { slug: "kisumu", name: "Kisumu", country: "Kenya", lat: -0.102206, lon: 34.761711, tz: "Africa/Nairobi" },
  { slug: "nakuru", name: "Nakuru", country: "Kenya", lat: -0.303099, lon: 36.080026, tz: "Africa/Nairobi" },
  { slug: "eldoret", name: "Eldoret", country: "Kenya", lat: 0.514277, lon: 35.269779, tz: "Africa/Nairobi" },
];
