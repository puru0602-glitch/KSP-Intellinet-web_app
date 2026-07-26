import type { Fir, Suspect } from "@/hooks/use-ksp-data";

export const CRIME_TYPES = [
  "Chain Snatching",
  "Cyber Fraud",
  "Burglary",
  "Organized Extortion",
  "Vehicle Theft",
  "Assault",
] as const;

export const TYPE_COLORS: Record<string, string> = {
  "Chain Snatching": "#f97316",
  "Cyber Fraud": "#06b6d4",
  Burglary: "#a855f7",
  "Organized Extortion": "#ef4444",
  "Vehicle Theft": "#eab308",
  Assault: "#ec4899",
};

export const DISTRICTS = [
  "All Districts",
  "Bengaluru Urban",
  "Mysuru",
  "Mangaluru",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
] as const;

export function computeKpi(firs: Fir[], suspects: Suspect[]) {
  const resolved = firs.filter(
    (f) => f.status === "Resolved" || f.status === "Chargesheeted",
  ).length;
  const open = firs.length - resolved;
  const loss = firs.reduce((s, f) => s + Number(f.loss_value || 0), 0);
  const withSuspect = firs.filter((f) => f.suspect_code).length;
  const avgRisk = suspects.length
    ? Math.round(suspects.reduce((s, x) => s + x.risk_score, 0) / suspects.length)
    : 0;
  return {
    totalFIRs: firs.length,
    resolved,
    openCases: open,
    repeatOffenders: suspects.length,
    riskIndex: avgRisk,
    propertyLoss: loss,
    detectionRate: firs.length ? Math.round((withSuspect / firs.length) * 100) : 0,
  };
}

/** Daily FIR volume by typology across the filtered window. */
export function computeTrend(firs: Fir[], days = 14) {
  const today = new Date();
  const buckets: { day: string; label: string; [k: string]: string | number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row: Record<string, string | number> = { day: key, label: key.slice(5) };
    for (const t of CRIME_TYPES) row[t] = 0;
    buckets.push(row as (typeof buckets)[number]);
  }
  const index = new Map(buckets.map((b) => [b.day, b]));
  for (const f of firs) {
    const row = index.get(f.incident_date);
    if (row && f.crime_type in row) row[f.crime_type] = Number(row[f.crime_type]) + 1;
  }
  return buckets;
}

export function computeTypology(firs: Fir[]) {
  const counts = new Map<string, number>();
  for (const f of firs) counts.set(f.crime_type, (counts.get(f.crime_type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const CATEGORY: Record<string, "Property" | "Cyber" | "Bodily"> = {
  "Chain Snatching": "Property",
  Burglary: "Property",
  "Vehicle Theft": "Property",
  "Cyber Fraud": "Cyber",
  "Organized Extortion": "Bodily",
  Assault: "Bodily",
};

export function computeDistrictBars(firs: Fir[]) {
  const map = new Map<
    string,
    { district: string; Property: number; Cyber: number; Bodily: number }
  >();
  for (const f of firs) {
    const key = f.district;
    if (!map.has(key))
      map.set(key, {
        district: key.replace("Hubballi-Dharwad", "Hubballi"),
        Property: 0,
        Cyber: 0,
        Bodily: 0,
      });
    const row = map.get(key)!;
    row[CATEGORY[f.crime_type] ?? "Property"] += 1;
  }
  return [...map.values()].sort(
    (a, b) => b.Property + b.Cyber + b.Bodily - (a.Property + a.Cyber + a.Bodily),
  );
}

/** Station-level spikes derived from the filtered FIR set. */
export function computeStationAlerts(firs: Fir[]) {
  const map = new Map<string, { station: string; district: string; type: string; count: number }>();
  for (const f of firs) {
    const key = `${f.station_name}|${f.crime_type}`;
    if (!map.has(key))
      map.set(key, { station: f.station_name, district: f.district, type: f.crime_type, count: 0 });
    map.get(key)!.count += 1;
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((a) => ({ ...a, delta: a.count * 15 + 12 }));
}

/** 7 x 24 matrix of FIR counts (day-of-week x hour). */
export function computeMatrix(firs: Fir[]) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const f of firs) {
    const dow = (new Date(f.incident_date).getDay() + 6) % 7; // Mon = 0
    grid[dow][Math.max(0, Math.min(23, f.incident_hour))] += 1;
  }
  return grid;
}

export function inr(v: number) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}
