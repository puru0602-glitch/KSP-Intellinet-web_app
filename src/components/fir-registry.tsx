import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Users,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ShieldAlert,
  IndianRupee,
  Download,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { FirDossierModal } from "./fir-dossier";
import { useCreateFir, useUpdateFir, useDeleteFir } from "@/hooks/use-ksp-mutations";
import { useFirs } from "@/hooks/use-ksp-data";
import { FirStatusIndicator } from "./fir-status-indicator";

/* ============================== FIR DATASET ============================== */

const FIR_STATIONS: Record<string, { station: string; localities: string[] }[]> = {
  "Bengaluru Urban": [
    {
      station: "Whitefield PS",
      localities: ["ITPL Main Rd", "Kundalahalli Gate", "Hope Farm Circle"],
    },
    {
      station: "Koramangala PS",
      localities: ["80 Ft Road", "Forum Mall Junction", "Ejipura Signal"],
    },
    {
      station: "Cybercrime PS",
      localities: ["Online / Non-contact", "Bank KYC Vector", "UPI Mule Chain"],
    },
    {
      station: "Yeshwanthpur PS",
      localities: ["Goods Shed Rd", "Rajajinagar Entry", "Mattikere Cross"],
    },
    { station: "HSR Layout PS", localities: ["Sector 7 Park", "Agara Lake Rd", "27th Main"] },
  ],
  Mysuru: [
    {
      station: "Devaraja PS",
      localities: ["Devaraja Market", "Sayyaji Rao Rd", "Dufferin Clock Tower"],
    },
    { station: "V.V. Puram PS", localities: ["Ramanuja Rd", "Chamaraja Double Rd"] },
    { station: "Nazarbad PS", localities: ["Bannimantap", "Zoo Main Gate"] },
  ],
  "Hubballi-Dharwad": [
    { station: "Vidyanagar PS", localities: ["Keshwapur Cross", "Vidyanagar 2nd Stage"] },
    { station: "Gokul Road PS", localities: ["Industrial Estate", "Tarihal Bypass"] },
  ],
  Mangaluru: [
    { station: "Bunder PS", localities: ["Old Port Rd", "Fish Market Lane", "Bunder Godowns"] },
    { station: "Pandeshwar PS", localities: ["State Bank Circle", "Car Street"] },
    { station: "Kadri PS", localities: ["Kadri Park", "Bejai Main Rd"] },
  ],
  Belagavi: [
    { station: "Camp PS", localities: ["Khanapur Rd", "Camp Market"] },
    { station: "Shahapur PS", localities: ["Ganpat Galli", "Vadgaon Cross"] },
  ],
  Kalaburagi: [
    { station: "Brahmapur PS", localities: ["Super Market Rd", "Jagat Circle"] },
    { station: "Roza PS", localities: ["Chincholi Rd", "Aiwan-e-Shahi"] },
  ],
};

export const FIR_TYPE_COLORS: Record<string, string> = {
  "Chain Snatching": "#f97316",
  "Cyber Fraud": "#06b6d4",
  Burglary: "#a855f7",
  "Organized Extortion": "#ef4444",
  "Vehicle Theft": "#eab308",
  Assault: "#ec4899",
};

export const TYPOLOGY: Record<
  string,
  {
    group: string;
    ipc: string;
    modality: string;
    weapon: string;
    window: string;
    recidivism: number;
    clearance: number;
  }
> = {
  "Chain Snatching": {
    group: "Property · Street Crime (Body-Contact)",
    ipc: "IPC 392 / 394 r/w 34",
    modality: "Pillion-rider snatch from moving two-wheeler, target isolated pedestrians",
    weapon: "None / manual force",
    window: "18:00 – 22:00",
    recidivism: 64,
    clearance: 41,
  },
  "Cyber Fraud": {
    group: "Economic · Non-Contact Digital",
    ipc: "IT Act 66C/66D r/w IPC 318",
    modality: "Social-engineered OTP capture via fake KYC or job offers, mule-account layering",
    weapon: "Not applicable",
    window: "10:00 – 17:00",
    recidivism: 38,
    clearance: 22,
  },
  Burglary: {
    group: "Property · House/Shop Breaking",
    ipc: "IPC 305 / 331(4) (BNS 305)",
    modality:
      "Reconnaissance of locked premises, rear-entry via grill cutting during festive absence",
    weapon: "Cutter / crowbar",
    window: "01:00 – 04:00",
    recidivism: 57,
    clearance: 35,
  },
  "Organized Extortion": {
    group: "Organized Crime · Coercion Network",
    ipc: "IPC 308 r/w KCOCA 3(1)",
    modality:
      "Rotating-SIM threat calls to traders, protection-money collection through local proxies",
    weapon: "Threat / firearm display",
    window: "20:00 – 01:00",
    recidivism: 72,
    clearance: 29,
  },
  "Vehicle Theft": {
    group: "Property · Motor Vehicle Offence",
    ipc: "IPC 303(2) (BNS)",
    modality: "Master-key ignition bypass on older two-wheelers from unattended parking bays",
    weapon: "Master key / duplicate",
    window: "02:00 – 05:00",
    recidivism: 68,
    clearance: 31,
  },
  Assault: {
    group: "Bodily Offence · Interpersonal",
    ipc: "IPC 115(2) / 118 (BNS)",
    modality: "Escalated altercation in public place, frequently intoxication-linked group scuffle",
    weapon: "Blunt object / bare hands",
    window: "21:00 – 00:00",
    recidivism: 44,
    clearance: 68,
  },
};

export type FirRecord = {
  id: string;
  district: string;
  station: string;
  locality: string;
  crimeType: string;
  status: "Under Investigation" | "Chargesheeted" | "Detected" | "Undetected" | "Court Trial";
  daysAgo: number;
  date: string;
  time: string;
  io: string;
  lossValue: number;
  suspect: {
    id: string;
    name: string;
    alias: string;
    risk: number;
    priors: number;
    mo: string;
    vehicle: string;
    phone: string;
    custody: string;
  } | null;
  victim: string;
  cctv: "Recovered" | "Requested" | "Unavailable";
  beat: string;
  coords: { lat: string; lng: string };
};

const FIRST_NAMES = [
  "Ravi",
  "Imran",
  "Prakash",
  "Satish",
  "Manjunath",
  "Lokesh",
  "Basavaraj",
  "Naveen",
  "Firoz",
  "Suresh",
  "Anand",
  "Girish",
  "Yousuf",
  "Vinay",
  "Chetan",
];
const ALIASES = [
  "Chikka",
  "Choti",
  "PD",
  "Sattu",
  "Manju",
  "Loki",
  "Basu",
  "Nani",
  "Firu",
  "Suri",
  "Andy",
  "Giri",
  "Yusu",
  "Vinnu",
  "Chintu",
];
const LAST = ["K.", "S.", "D.", "M.", "R.", "B.", "N.", "T."];
const IOS = [
  "PSI H. Nagaraj",
  "PI S. Rekha",
  "PSI M. Iqbal",
  "PI D. Chandrashekar",
  "PSI R. Kavitha",
  "PI A. Vasanth",
  "PSI G. Shruthi",
];
const STATUSES: FirRecord["status"][] = [
  "Under Investigation",
  "Chargesheeted",
  "Detected",
  "Undetected",
  "Court Trial",
];
const CCTV: FirRecord["cctv"][] = ["Recovered", "Requested", "Unavailable"];
const CUSTODY = [
  "Judicial custody · Parappana Agrahara",
  "On bail since 12 Mar",
  "Absconding · BOLO active",
  "Police custody · 3-day remand",
  "Not arrested",
];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function isoDate(daysAgo: number) {
  const base = new Date("2026-07-25T00:00:00Z").getTime();
  return new Date(base - daysAgo * 86400000).toISOString().slice(0, 10);
}

const ALL_FIRS: FirRecord[] = (() => {
  const r = rng(20260725);
  const districts = Object.keys(FIR_STATIONS);
  const types = Object.keys(FIR_TYPE_COLORS);
  const out: FirRecord[] = [];
  for (let i = 0; i < 900; i++) {
    const district = districts[Math.floor(r() * districts.length)];
    const stationEntry = FIR_STATIONS[district][Math.floor(r() * FIR_STATIONS[district].length)];
    const crimeType = types[Math.floor(r() * types.length)];
    const daysAgo = Math.floor(Math.pow(r(), 1.4) * 90);
    const hasSuspect = r() > 0.28;
    const nameIdx = Math.floor(r() * FIRST_NAMES.length);
    const stationCode = stationEntry.station.slice(0, 3).toUpperCase();
    out.push({
      id: `FIR/${stationCode}/2026/${String(1000 + Math.floor(r() * 8999))}`,
      district,
      station: stationEntry.station,
      locality: stationEntry.localities[Math.floor(r() * stationEntry.localities.length)],
      crimeType,
      status: STATUSES[Math.floor(r() * STATUSES.length)],
      daysAgo,
      date: isoDate(daysAgo),
      time: `${String(Math.floor(r() * 24)).padStart(2, "0")}:${String(Math.floor(r() * 12) * 5).padStart(2, "0")}`,
      io: IOS[Math.floor(r() * IOS.length)],
      lossValue: Math.floor(r() * 480000) + 4000,
      victim: `${FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]} ${LAST[Math.floor(r() * LAST.length)]} · ${Math.floor(22 + r() * 45)}yrs`,
      cctv: CCTV[Math.floor(r() * CCTV.length)],
      beat: `Beat ${Math.floor(1 + r() * 24)}`,
      coords: { lat: (12.2 + r() * 4.6).toFixed(4), lng: (74.8 + r() * 3.2).toFixed(4) },
      suspect: hasSuspect
        ? {
            id: `S-${1000 + Math.floor(r() * 8999)}`,
            name: `${FIRST_NAMES[nameIdx]} ${LAST[Math.floor(r() * LAST.length)]}`,
            alias: ALIASES[nameIdx],
            risk: Math.floor(45 + r() * 54),
            priors: Math.floor(r() * 9),
            mo: TYPOLOGY[crimeType].modality,
            vehicle:
              r() > 0.45
                ? `KA-${String(Math.floor(1 + r() * 60)).padStart(2, "0")}-${String.fromCharCode(65 + Math.floor(r() * 26))}${String.fromCharCode(65 + Math.floor(r() * 26))}-${String(Math.floor(1000 + r() * 8999))}`
                : "—",
            phone: `+91-${Math.floor(70 + r() * 29)}•••••${String(Math.floor(100 + r() * 899))}`,
            custody: CUSTODY[Math.floor(r() * CUSTODY.length)],
          }
        : null,
    });
  }
  return out;
})();

const RANGE_DAYS: Record<string, number> = {
  "Last 24 hours": 1,
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
};

/* ============================== VIEW ============================== */

type SortKey = "date" | "district" | "crimeType" | "lossValue" | "status";

export function FirRegistryView({
  district,
  crimeType,
  dateRange,
}: {
  district: string;
  crimeType: string;
  dateRange: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<FirRecord | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const deleteFirMutation = useDeleteFir();
  const updateFirMutation = useUpdateFir();
  const pageSize = 12;

  const scoped = useMemo(() => {
    const maxDays = RANGE_DAYS[dateRange] ?? 90;
    return ALL_FIRS.filter(
      (f) =>
        f.daysAgo <= maxDays &&
        (district === "All Districts" || f.district === district) &&
        (crimeType === "All Types" || f.crimeType === crimeType),
    );
  }, [district, crimeType, dateRange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? scoped.filter((f) =>
          [
            f.id,
            f.district,
            f.station,
            f.locality,
            f.crimeType,
            f.status,
            f.io,
            f.beat,
            f.suspect?.name ?? "",
            f.suspect?.alias ?? "",
            f.suspect?.id ?? "",
            f.suspect?.vehicle ?? "",
            TYPOLOGY[f.crimeType].group,
            TYPOLOGY[f.crimeType].ipc,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : scoped;
    const dir = sortAsc ? 1 : -1;
    return [...matched].sort((a, b) => {
      if (sortKey === "lossValue") return (a.lossValue - b.lossValue) * dir;
      if (sortKey === "date") return (b.daysAgo - a.daysAgo) * -dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
  }, [scoped, query, sortKey, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const stats = useMemo(() => {
    const loss = filtered.reduce((s, f) => s + f.lossValue, 0);
    const withSuspect = filtered.filter((f) => f.suspect).length;
    const undetected = filtered.filter((f) => f.status === "Undetected").length;
    return { loss, withSuspect, undetected };
  }, [filtered]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(k !== "date" && k !== "lossValue");
    }
    setPage(0);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Module 6 · Case Records
          </div>
          <h2 className="mt-0.5 text-xl md:text-2xl font-bold text-slate-100">
            FIR &amp; Incident Registry
          </h2>
          <p className="text-xs text-slate-400">
            Searchable case ledger scoped to <span className="text-slate-200">{district}</span> ·{" "}
            <span className="text-slate-200">{crimeType}</span> ·{" "}
            <span className="text-slate-200">{dateRange}</span> — drill down for suspect, location
            and typology dossiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cyan-500 transition-colors"
          >
            <Plus className="h-4 w-4" /> Register New FIR
          </button>
          <button
            onClick={() => {
              const headers = [
                "FIR ID",
                "Date",
                "District",
                "Station",
                "Crime Type",
                "Status",
                "Loss (INR)",
                "IO",
              ];
              const csvRows = [headers.join(",")];
              filtered.forEach((f) => {
                csvRows.push(
                  [
                    f.id,
                    f.date,
                    f.district,
                    f.station,
                    f.crimeType,
                    f.status,
                    f.lossValue,
                    `"${f.io}"`,
                  ].join(","),
                );
              });
              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ksp_firs_${district.replace(/\s+/g, "_")}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/60 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          label="FIRs in scope"
          value={filtered.length}
          icon={<FileText className="h-4 w-4" />}
        />
        <MiniStat
          label="With named suspect"
          value={stats.withSuspect}
          icon={<Users className="h-4 w-4" />}
        />
        <MiniStat
          label="Undetected"
          value={stats.undetected}
          tone="warn"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <MiniStat
          label="Property loss"
          value={`₹${(stats.loss / 100000).toFixed(1)}L`}
          icon={<IndianRupee className="h-4 w-4" />}
        />
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 shadow-inner shadow-black/30">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 p-3">
          <label className="flex flex-1 min-w-[240px] items-center gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus-within:border-cyan-500/60">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search FIR no., station, locality, suspect, alias, vehicle, IPC section, IO…"
              className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-200">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <div className="text-[11px] text-slate-500">
            Showing {rows.length ? current * pageSize + 1 : 0}–{current * pageSize + rows.length} of{" "}
            {filtered.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500">
                <Th onClick={() => toggleSort("date")}>Date / Time</Th>
                <Th>FIR No.</Th>
                <Th onClick={() => toggleSort("crimeType")}>Typology</Th>
                <Th onClick={() => toggleSort("district")}>District / Station</Th>
                <Th>Location</Th>
                <Th>Suspect</Th>
                <Th onClick={() => toggleSort("status")}>Status</Th>
                <Th onClick={() => toggleSort("lossValue")}>Loss</Th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr
                  key={f.id + f.date + f.time}
                  onClick={() => setSelected(f)}
                  className="cursor-pointer border-b border-slate-800/70 hover:bg-cyan-500/5"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    {f.date}
                    <span className="text-slate-500"> {f.time}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-cyan-300">{f.id}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: FIR_TYPE_COLORS[f.crimeType] }}
                      />
                      <span className="text-slate-100">{f.crimeType}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                    {f.district}
                    <div className="text-[10px] text-slate-500">{f.station}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                    {f.locality}
                    <div className="text-[10px] text-slate-500">{f.beat}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {f.suspect ? (
                      <span className="text-slate-100">
                        {f.suspect.name}
                        <div className="text-[10px] text-slate-500">
                          “{f.suspect.alias}” · risk {f.suspect.risk}
                        </div>
                      </span>
                    ) : (
                      <span className="text-slate-500">Unidentified</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusChip status={f.status} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-300">
                    ₹{f.lossValue.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-600" />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                    No FIRs match “{query}” within the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ArrowUpDown className="h-3 w-3" /> Sorted by {sortKey} ·{" "}
            {sortAsc ? "ascending" : "descending"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, current - 1))}
              disabled={current === 0}
              className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[11px] text-slate-300 disabled:opacity-40 hover:border-cyan-500/60"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[11px] text-slate-400">
              Page {current + 1} / {pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pages - 1, current + 1))}
              disabled={current >= pages - 1}
              className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[11px] text-slate-300 disabled:opacity-40 hover:border-cyan-500/60"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <FirDossierModal
          fir={selected}
          scope={scoped}
          filterLabel={`${district} · ${crimeType} · ${dateRange}`}
          onOpenFir={(f) => setSelected(f)}
          onClose={() => setSelected(null)}
        />
      )}

      {isRegisterOpen && <NewFirRegistrationModal onClose={() => setIsRegisterOpen(false)} />}
    </>
  );
}

function NewFirRegistrationModal({ onClose }: { onClose: () => void }) {
  const createFirMutation = useCreateFir();
  const districts = Object.keys(FIR_STATIONS);
  const crimeTypes = Object.keys(FIR_TYPE_COLORS);

  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru Urban");
  const [stationName, setStationName] = useState("Whitefield PS");
  const [crimeType, setCrimeType] = useState("Vehicle Theft");
  const [locality, setLocality] = useState("ITPL Main Rd");
  const [lossValue, setLossValue] = useState(45000);
  const [summary, setSummary] = useState("Unattended two-wheeler stolen during night window.");
  const [officer, setOfficer] = useState("PSI H. Nagaraj");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFirMutation.mutate(
      {
        fir_number: "", // Auto-generated by backend
        incident_date: new Date().toISOString().slice(0, 10),
        incident_hour: new Date().getHours(),
        district: selectedDistrict,
        station_name: stationName,
        crime_type: crimeType,
        status: "Under Investigation",
        loss_value: Number(lossValue),
        locality,
        summary,
        investigating_officer: officer,
        latitude: null,
        longitude: null,
        suspect_code: null,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              SCRB Data Entry Portal
            </div>
            <h3 className="text-lg font-bold text-slate-100">Register New FIR Record</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">District Jurisdiction</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  const st = FIR_STATIONS[e.target.value]?.[0]?.station || "Central PS";
                  setStationName(st);
                }}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Police Station</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Crime Typology</label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {crimeTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Locality / Landmark</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Loss Value (INR ₹)</label>
              <input
                type="number"
                value={lossValue}
                onChange={(e) => setLossValue(Number(e.target.value))}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Investigating Officer (IO)</label>
              <input
                type="text"
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              Incident Summary &amp; Modus Operandi
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFirMutation.isPending}
              className="flex items-center gap-1.5 rounded bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {createFirMutation.isPending ? "Persisting..." : "Register FIR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) {
  return (
    <th className="px-3 py-2 font-semibold">
      {onClick ? (
        <button
          onClick={onClick}
          className="flex items-center gap-1 uppercase tracking-wider hover:text-cyan-300"
        >
          {children} <ArrowUpDown className="h-3 w-3" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className={tone === "warn" ? "text-red-400" : "text-cyan-400"}>{icon}</span>
      </div>
      <div className="mt-1 text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

export function StatusChip({ status }: { status: FirRecord["status"] }) {
  return <FirStatusIndicator status={status} size="sm" />;
}
