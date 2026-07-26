import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  LayerGroup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Fir, Hotspot, PoliceStation } from "@/hooks/use-ksp-data";
import { TYPE_COLORS, inr } from "@/lib/ksp-analytics";

function heatColor(intensity: number) {
  const hue = 55 - intensity * 55; // yellow -> red
  return `hsl(${hue}, 92%, 55%)`;
}

export type MapLayers = {
  heat: boolean;
  stations: boolean;
  incidents: boolean;
  cluster: boolean;
};

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

type Cluster = { key: string; lat: number; lng: number; items: Fir[] };

function clusterFirs(firs: Fir[], zoom: number): Cluster[] {
  const cell = 4 / Math.pow(2, Math.max(0, zoom - 6)); // degrees
  const buckets = new Map<string, Cluster>();
  for (const f of firs) {
    const key = `${Math.floor(f.latitude! / cell)}:${Math.floor(f.longitude! / cell)}`;
    const b = buckets.get(key);
    if (b) {
      b.items.push(f);
      b.lat = (b.lat * (b.items.length - 1) + f.latitude!) / b.items.length;
      b.lng = (b.lng * (b.items.length - 1) + f.longitude!) / b.items.length;
    } else {
      buckets.set(key, { key, lat: f.latitude!, lng: f.longitude!, items: [f] });
    }
  }
  return [...buckets.values()];
}

export default function KarnatakaMapInner({
  hotspots,
  stations,
  firs,
  hour,
  layers,
  intensity,
  onSelectFir,
  onSelectStation,
}: {
  hotspots: Hotspot[];
  stations: PoliceStation[];
  firs: Fir[];
  hour: number;
  layers: MapLayers;
  intensity: number;
  onSelectFir: (f: Fir) => void;
  onSelectStation: (s: PoliceStation) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(7);
  useEffect(() => setMounted(true), []);

  // Incidents within a +/-2 hour band of the timeline scrubber
  const bandFirs = useMemo(
    () =>
      firs.filter(
        (f) =>
          f.latitude != null &&
          f.longitude != null &&
          Math.min(Math.abs(f.incident_hour - hour), 24 - Math.abs(f.incident_hour - hour)) <= 2,
      ),
    [firs, hour],
  );

  const clusters = useMemo(
    () => (layers.cluster ? clusterFirs(bandFirs, zoom) : []),
    [bandFirs, zoom, layers.cluster],
  );

  if (!mounted) return <div className="h-full w-full bg-slate-950" />;

  const stationIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:3px;background:#06b6d4;border:2px solid #0f172a;box-shadow:0 0 0 3px rgba(6,182,212,.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const clusterIcon = (count: number) => {
    const size = count > 20 ? 46 : count > 8 ? 38 : 32;
    return L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:grid;place-items:center;
        background:rgba(239,68,68,.28);border:2px solid rgba(239,68,68,.85);color:#fecaca;
        font:700 ${size > 40 ? 13 : 11}px ui-sans-serif,system-ui;box-shadow:0 0 0 6px rgba(239,68,68,.12)">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <MapContainer
      center={[13.3, 76.2]}
      zoom={7}
      minZoom={6}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#020617" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      <ZoomWatcher onZoom={setZoom} />

      {layers.heat && (
        <LayerGroup>
          {hotspots.map((h) => {
            const v = Math.min(1, Number(h.intensity) * intensity);
            return (
              <CircleMarker
                key={`heat-${h.id}`}
                center={[h.latitude, h.longitude]}
                radius={10 + v * 34}
                pathOptions={{
                  color: heatColor(v),
                  fillColor: heatColor(v),
                  fillOpacity: 0.16 + v * 0.35,
                  opacity: 0.5,
                  weight: 1,
                }}
              >
                <Tooltip>
                  <span className="text-xs font-semibold">{h.name}</span>
                  <br />
                  {h.dominant_crime_type} · {h.incident_count} incidents
                  <br />
                  Intensity {(Number(h.intensity) * 100).toFixed(0)}%
                  {h.peak_window ? ` · Peak ${h.peak_window}` : ""}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </LayerGroup>
      )}

      {layers.stations && (
        <LayerGroup>
          {stations.map((s) => (
            <Marker
              key={s.id}
              position={[s.latitude, s.longitude]}
              icon={stationIcon}
              eventHandlers={{ click: () => onSelectStation(s) }}
            >
              <Tooltip>
                <span className="text-xs font-semibold">{s.name}</span>
                <br />
                {s.district} · click to open latest FIR dossier
              </Tooltip>
            </Marker>
          ))}
        </LayerGroup>
      )}

      {layers.incidents && (
        <LayerGroup>
          {layers.cluster
            ? clusters.map((c) =>
                c.items.length > 1 ? (
                  <Marker
                    key={c.key}
                    position={[c.lat, c.lng]}
                    icon={clusterIcon(c.items.length)}
                    eventHandlers={{ click: () => onSelectFir(c.items[0]) }}
                  >
                    <Tooltip>
                      <span className="text-xs font-semibold">
                        {c.items.length} incidents in this cluster
                      </span>
                      <br />
                      {[...new Set(c.items.map((f) => f.district))].join(", ")}
                      <br />
                      Click to open the newest dossier
                    </Tooltip>
                  </Marker>
                ) : (
                  <IncidentDot key={c.key} f={c.items[0]} onSelectFir={onSelectFir} />
                ),
              )
            : bandFirs.map((f) => <IncidentDot key={f.id} f={f} onSelectFir={onSelectFir} />)}
        </LayerGroup>
      )}
    </MapContainer>
  );
}

function IncidentDot({ f, onSelectFir }: { f: Fir; onSelectFir: (f: Fir) => void }) {
  return (
    <CircleMarker
      center={[f.latitude!, f.longitude!]}
      radius={6}
      eventHandlers={{ click: () => onSelectFir(f) }}
      pathOptions={{
        color: "#0f172a",
        weight: 1,
        fillColor: TYPE_COLORS[f.crime_type] ?? "#ef4444",
        fillOpacity: 0.95,
      }}
    >
      <Tooltip>
        <span className="text-xs font-semibold">{f.fir_number}</span>
        <br />
        {f.crime_type} · {String(f.incident_hour).padStart(2, "0")}:00
        <br />
        {f.locality}, {f.district} · loss {inr(Number(f.loss_value))}
        <br />
        Click to open the full dossier
      </Tooltip>
    </CircleMarker>
  );
}
