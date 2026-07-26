import React, { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Shield, Layers, Flame, Sliders, Filter } from "lucide-react";
import type { Fir, PoliceStation } from "@/hooks/use-ksp-data";
import { usePoliceStations } from "@/hooks/use-ksp-data";
import { inr } from "@/lib/ksp-analytics";

interface CrimeDensityHeatmapProps {
  firs: Fir[];
  district: string;
  className?: string;
}

// Center points for Karnataka districts
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  "Bengaluru Urban": [12.9716, 77.5946],
  Mysuru: [12.2958, 76.6394],
  "Hubballi-Dharwad": [15.3647, 75.124],
  Mangaluru: [12.9141, 74.856],
  Belagavi: [15.8497, 74.4977],
  Kalaburagi: [17.3297, 76.8343],
};

const DEFAULT_CENTER: [number, number] = [14.5204, 75.7224]; // Karnataka center

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

export default function CrimeDensityHeatmapInner({ firs, district, className = "" }: CrimeDensityHeatmapProps) {
  const [mounted, setMounted] = useState(false);
  const { data: stations = [] } = usePoliceStations(district);

  const [mapMode, setMapMode] = useState<"density" | "stations" | "both">("both");
  const [intensityMultiplier, setIntensityMultiplier] = useState<number>(1.2);

  useEffect(() => {
    setMounted(true);
  }, []);

  const centerCoord = DISTRICT_CENTERS[district] || DEFAULT_CENTER;
  const zoomLevel = district === "All Districts" ? 7 : 11;

  // Aggregate FIR density by station / coordinate node
  const stationDensityNodes = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        district: string;
        lat: number;
        lng: number;
        count: number;
        totalLoss: number;
        topCrimeType: string;
        crimes: Record<string, number>;
      }
    >();

    firs.forEach((f) => {
      if (!f.latitude || !f.longitude) return;
      const key = f.station_name || `${f.latitude.toFixed(2)},${f.longitude.toFixed(2)}`;

      if (!map.has(key)) {
        map.set(key, {
          name: f.station_name || "Police Beat Node",
          district: f.district,
          lat: f.latitude,
          lng: f.longitude,
          count: 0,
          totalLoss: 0,
          topCrimeType: f.crime_type,
          crimes: {},
        });
      }

      const node = map.get(key)!;
      node.count += 1;
      node.totalLoss += f.loss_value || 0;
      node.crimes[f.crime_type] = (node.crimes[f.crime_type] || 0) + 1;
    });

    // Calculate top crime type for each node
    return Array.from(map.values()).map((node) => {
      let topType = node.topCrimeType;
      let maxC = 0;
      Object.entries(node.crimes).forEach(([ct, c]) => {
        if (c > maxC) {
          maxC = c;
          topType = ct;
        }
      });
      return {
        ...node,
        topCrimeType: topType,
      };
    });
  }, [firs]);

  const maxNodeCount = useMemo(() => {
    return Math.max(...stationDensityNodes.map((n) => n.count), 1);
  }, [stationDensityNodes]);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            <span>Spatiotemporal Crime Density Heatmap</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Leaflet Geospatial Canvas</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Geographical Crime Incident Distribution ({district})
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Interactive spatial heat layer representing FIR report frequency and property loss
            concentration across police station sub-divisions.
          </p>
        </div>

        {/* Map Layer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMapMode("both")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                mapMode === "both"
                  ? "bg-white text-rose-800 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Heat & Stations
            </button>
            <button
              type="button"
              onClick={() => setMapMode("density")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                mapMode === "density"
                  ? "bg-white text-rose-800 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Heatmap Only
            </button>
            <button
              type="button"
              onClick={() => setMapMode("stations")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                mapMode === "stations"
                  ? "bg-white text-rose-800 font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Stations Only
            </button>
          </div>

          {/* Intensity Multiplier Slider */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500">Intensity:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.2"
              value={intensityMultiplier}
              onChange={(e) => setIntensityMultiplier(Number(e.target.value))}
              className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              title="Adjust heat circle spread radius"
            />
          </div>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="h-[380px] w-full rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
        {!mounted ? (
          <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">
            Initializing Geospatial Map Canvas...
          </div>
        ) : (
          <MapContainer
            center={centerCoord}
            zoom={zoomLevel}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
          >
            <MapViewController center={centerCoord} zoom={zoomLevel} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Heat Density Circles */}
            {(mapMode === "density" || mapMode === "both") &&
              stationDensityNodes.map((node, i) => {
                const ratio = node.count / maxNodeCount;
                const radius = Math.max(
                  16,
                  Math.min(65, Math.round(ratio * 45 * intensityMultiplier)),
                );
                const color =
                  ratio > 0.7
                    ? "#ef4444" // High density - red
                    : ratio > 0.4
                      ? "#f97316" // Med-high density - orange
                      : ratio > 0.2
                        ? "#eab308" // Med density - yellow
                        : "#3b82f6"; // Low density - blue

                return (
                  <CircleMarker
                    key={`heat-${i}-${node.name}`}
                    center={[node.lat, node.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.35,
                      color: color,
                      weight: 1.5,
                      opacity: 0.8,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div className="text-xs font-semibold text-slate-900">
                        <p className="font-bold text-rose-700">{node.name}</p>
                        <p className="text-slate-600">Density Weight: {node.count} FIRs</p>
                        <p className="text-purple-700">Loss: {inr(node.totalLoss)}</p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

            {/* Render Station Location Markers */}
            {(mapMode === "stations" || mapMode === "both") &&
              stationDensityNodes.map((node, i) => (
                <CircleMarker
                  key={`stn-${i}-${node.name}`}
                  center={[node.lat, node.lng]}
                  radius={7}
                  pathOptions={{
                    fillColor: "#0284c7",
                    fillOpacity: 0.9,
                    color: "#ffffff",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                        {node.name}
                      </div>
                      <p className="text-slate-600">
                        Jurisdiction:{" "}
                        <span className="font-semibold text-slate-800">{node.district}</span>
                      </p>
                      <p className="text-slate-600">
                        Total FIR Reports:{" "}
                        <span className="font-bold text-blue-700">{node.count}</span>
                      </p>
                      <p className="text-slate-600">
                        Top Crime Typology:{" "}
                        <span className="font-semibold text-amber-700">{node.topCrimeType}</span>
                      </p>
                      <p className="text-slate-600">
                        Total Property Loss:{" "}
                        <span className="font-semibold text-purple-700">{inr(node.totalLoss)}</span>
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        )}

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-slate-200 bg-white/95 backdrop-blur-md p-2.5 shadow-lg text-[11px] space-y-1.5">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">
            Density Legend
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical Heat Node (&gt;70%)
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High Crime Density (40-70%)
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Moderate Density (20-40%)
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Baseline / Low Density
          </div>
        </div>
      </div>
    </div>
  );
}
