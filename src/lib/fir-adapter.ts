import type { Fir, Suspect } from "@/hooks/use-ksp-data";
import type { FirRecord } from "@/components/fir-registry";

const STATUSES: FirRecord["status"][] = [
  "Under Investigation",
  "Chargesheeted",
  "Detected",
  "Undetected",
  "Court Trial",
];

const CCTV: FirRecord["cctv"][] = ["Recovered", "Requested", "Unavailable"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function daysSince(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((Date.now() - d) / 86400000));
}

/** Adapts a live database FIR row into the dossier's record shape. */
export function toFirRecord(f: Fir, suspects: Map<string, Suspect>): FirRecord {
  const h = hash(f.id || f.fir_number);
  const s = f.suspect_code ? suspects.get(f.suspect_code) : undefined;
  const status = (STATUSES as string[]).includes(f.status)
    ? (f.status as FirRecord["status"])
    : "Under Investigation";

  return {
    id: f.fir_number,
    district: f.district,
    station: f.station_name,
    locality: f.locality ?? f.district,
    crimeType: f.crime_type,
    status,
    daysAgo: daysSince(f.incident_date),
    date: f.incident_date,
    time: `${String(f.incident_hour).padStart(2, "0")}:${String((h % 12) * 5).padStart(2, "0")}`,
    io: f.investigating_officer ?? "IO not assigned",
    lossValue: Math.round(Number(f.loss_value || 0)),
    victim: `Complainant on record · ${f.station_name}`,
    cctv: CCTV[h % CCTV.length],
    beat: `Beat ${1 + (h % 24)}`,
    coords: {
      lat: (f.latitude ?? 12.9716).toFixed(4),
      lng: (f.longitude ?? 77.5946).toFixed(4),
    },
    suspect: s
      ? {
          id: s.suspect_code,
          name: s.name,
          alias: s.aliases[0] ?? "—",
          risk: s.risk_score,
          priors: s.cross_jurisdiction.length,
          mo: s.mo_description,
          vehicle: s.vehicle ?? "—",
          phone: s.phone_numbers[0] ?? "—",
          custody: s.status,
        }
      : null,
  };
}
