"use client";

import dynamic from "next/dynamic";
import type { LocationSummary } from "@/lib/types";
import { getAQIColor } from "@/lib/aqi";
import { cn } from "@/lib/utils";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

interface Props {
  locations: LocationSummary[];
  selectedSlug?: string;
  onSelect: (slug: string) => void;
}

export function MapView({ locations, selectedSlug, onSelect }: Props) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-slate-700/60 sm:h-[480px]">
      <MapContainer
        center={[-1.2864, 36.8172]}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => {
          const aqi = loc.latest?.aqi ?? 0;
          const color = getAQIColor(aqi);
          const isSelected = loc.slug === selectedSlug;

          return (
            <Marker
              key={loc.slug}
              position={[loc.latitude, loc.longitude]}
              eventHandlers={{
                click: () => onSelect(loc.slug),
              }}
              icon={createDivIcon(color, aqi, isSelected)}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-slate-900">{loc.name}</p>
                  <p className="text-sm text-slate-600">AQI {aqi}</p>
                  <p className="text-xs text-slate-500">{loc.latest?.category}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function createDivIcon(color: string, aqi: number, selected: boolean) {
  // Leaflet must be loaded on client before this runs
  if (typeof window === "undefined") return undefined as never;

  const L = require("leaflet");
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-bold shadow-lg"
           style="background:${color}; color:${aqi > 150 ? "#fff" : "#0f172a"}; ${selected ? "box-shadow: 0 0 0 3px rgba(56,189,248,0.6);" : ""}">
        ${aqi}
      </div>
      <div class="absolute inset-0 rounded-full opacity-60" style="background:${color}; animation: pulse-ring 2s infinite;"></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
