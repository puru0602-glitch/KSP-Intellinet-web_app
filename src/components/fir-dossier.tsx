import { useEffect, useMemo, useState } from "react";
import {
  X,
  Users,
  MapPin,
  Layers,
  FileText,
  Clock,
  Car,
  Phone,
  ShieldAlert,
  Camera,
  IndianRupee,
  Fingerprint,
  Radio,
  Smartphone,
  FlaskConical,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Gavel,
  Printer,
  Share2,
  FileDown,
  Loader2,
} from "lucide-react";
import { exportDossierPdf } from "@/lib/fir-dossier-pdf";
import type { FirRecord } from "./fir-registry";
import { TYPOLOGY, FIR_TYPE_COLORS, StatusChip } from "./fir-registry";

/* ---------- deterministic derivations ---------- */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

const ASSOC_ROLES = [
  "Co-accused · pillion rider",
  "Receiver / fence",
  "Mule account holder",
  "Harbourer",
  "Look-out",
  "Vehicle supplier",
];
const ASSOC_NAMES = [
  "Mahesh T.",
  "Sadiq A.",
  "Ramesh B.",
  "Kiran N.",
  "Javed S.",
  "Umesh R.",
  "Praveen K.",
  "Altaf M.",
];
const ASSOC_STATE = ["Arrested", "Absconding", "Under watch", "Bailed"];

type Assoc = {
  name: string;
  role: string;
  state: string;
  risk: number;
  priors: number;
  link: string;
};

function associates(fir: FirRecord): Assoc[] {
  if (!fir.suspect) return [];
  const h = hash(fir.id + fir.time);
  const n = 1 + (h % 3);
  return Array.from({ length: n }, (_, i) => {
    const s = hash(fir.id + i);
    return {
      name: pick(ASSOC_NAMES, s),
      role: pick(ASSOC_ROLES, s >> 3),
      state: pick(ASSOC_STATE, s >> 5),
      risk: 32 + (s % 55),
      priors: s % 7,
      link: pick(
        [
          "CDR co-location",
          "Shared vehicle",
          "UPI transfer trail",
          "Prior joint FIR",
          "Informant corroboration",
        ],
        s >> 7,
      ),
    };
  });
}

type Evidence = {
  label: string;
  detail: string;
  status: "Collected" | "Pending" | "Sent to FSL" | "Unavailable";
  icon: React.ReactNode;
};

function evidence(fir: FirRecord): Evidence[] {
  const h = hash(fir.id + fir.station);
  const st = (n: number): Evidence["status"] =>
    (["Collected", "Pending", "Sent to FSL", "Unavailable"] as const)[(h >> n) % 4];
  const items: Evidence[] = [
    {
      label: "CCTV / ANPR",
      detail: `${fir.cctv} · ${1 + (h % 6)} camera nodes on escape route`,
      status:
        fir.cctv === "Recovered"
          ? "Collected"
          : fir.cctv === "Requested"
            ? "Pending"
            : "Unavailable",
      icon: <Camera className="h-3.5 w-3.5" />,
    },
    {
      label: "CDR / IPDR",
      detail: `${1 + (h % 4)} tower dumps requisitioned for scene cell-site`,
      status: st(2),
      icon: <Radio className="h-3.5 w-3.5" />,
    },
    {
      label: "Fingerprint lifts",
      detail: `${h % 5} chance prints lifted, AFIS query raised`,
      status: st(4),
      icon: <Fingerprint className="h-3.5 w-3.5" />,
    },
    {
      label: "FSL exhibits",
      detail: `Exhibit ${fir.id.slice(-4)}/A · trace and tool-mark comparison`,
      status: st(6),
      icon: <FlaskConical className="h-3.5 w-3.5" />,
    },
    {
      label: "Digital devices",
      detail:
        fir.suspect?.vehicle !== "—"
          ? "Handset + vehicle seized, cyber-forensic imaging queued"
          : "Complainant handset imaged for transaction proof",
      status: st(8),
      icon: <Smartphone className="h-3.5 w-3.5" />,
    },
    {
      label: "Witness statements",
      detail: `${1 + (h % 5)} statements recorded u/s 180 BNSS`,
      status: st(10),
      icon: <Users className="h-3.5 w-3.5" />,
    },
  ];
  return items;
}

type Ev = { day: number; label: string; detail: string; done: boolean };

function timeline(fir: FirRecord): Ev[] {
  const h = hash(fir.id + fir.date);
  const stage = [
    "Under Investigation",
    "Detected",
    "Chargesheeted",
    "Court Trial",
    "Undetected",
  ].indexOf(fir.status);
  const base: Ev[] = [
    {
      day: 0,
      label: "Offence reported",
      detail: `Complaint received at ${fir.station} · ${fir.time} hrs`,
      done: true,
    },
    {
      day: 0,
      label: "FIR registered",
      detail: `${fir.id} u/s ${TYPOLOGY[fir.crimeType].ipc}`,
      done: true,
    },
    {
      day: 0,
      label: "Scene of crime visit",
      detail: `SOC team + IO ${fir.io} · ${fir.beat}`,
      done: true,
    },
    {
      day: 1 + (h % 3),
      label: "Evidence requisition",
      detail: "CCTV, CDR and FSL requisitions issued",
      done: true,
    },
    {
      day: 3 + (h % 6),
      label: "Suspect identification",
      detail: fir.suspect
        ? `${fir.suspect.name} identified via ${pick(["CCTV match", "informant input", "MO database hit", "CDR analysis"], h)}`
        : "No suspect identified — source development ongoing",
      done: !!fir.suspect,
    },
    {
      day: 6 + (h % 9),
      label: "Arrest / custody action",
      detail: fir.suspect ? fir.suspect.custody : "Pending identification",
      done: !!fir.suspect && stage >= 1,
    },
    {
      day: 12 + (h % 14),
      label: "Property recovery",
      detail: `₹${Math.round(fir.lossValue * ((h % 60) / 100)).toLocaleString("en-IN")} of ₹${fir.lossValue.toLocaleString("en-IN")} recovered`,
      done: stage >= 1,
    },
    {
      day: 30 + (h % 20),
      label: "Chargesheet filed",
      detail: "Final report u/s 193 BNSS before jurisdictional court",
      done: fir.status === "Chargesheeted" || fir.status === "Court Trial",
    },
    {
      day: 45 + (h % 30),
      label: "Trial commenced",
      detail: "Committed to Sessions / CJM court, evidence stage",
      done: fir.status === "Court Trial",
    },
  ];
  return base
    .filter((e) => e.day <= Math.max(fir.daysAgo, 1) + 2 || e.done)
    .sort((a, b) => a.day - b.day);
}

/* ---------- modal ---------- */

type Tab = "overview" | "suspects" | "evidence" | "timeline" | "related";

export function FirDossierModal({
  fir,
  scope,
  filterLabel,
  onOpenFir,
  onClose,
}: {
  fir: FirRecord;
  scope: FirRecord[];
  filterLabel: string;
  onOpenFir: (f: FirRecord) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [exporting, setExporting] = useState(false);
  const typology = TYPOLOGY[fir.crimeType];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const assoc = useMemo(() => associates(fir), [fir]);
  const ev = useMemo(() => evidence(fir), [fir]);
  const tl = useMemo(() => timeline(fir), [fir]);

  const related = useMemo(() => {
    const others = scope.filter((f) => !(f.id === fir.id && f.time === fir.time));
    const scored = others
      .map((f) => {
        let s = 0;
        const why: string[] = [];
        if (f.crimeType === fir.crimeType) {
          s += 3;
          why.push("same typology");
        }
        if (f.station === fir.station) {
          s += 3;
          why.push("same station");
        } else if (f.district === fir.district) {
          s += 1;
          why.push("same district");
        }
        if (f.locality === fir.locality) {
          s += 2;
          why.push("same locality");
        }
        if (fir.suspect && f.suspect && f.suspect.name === fir.suspect.name) {
          s += 5;
          why.push("same accused");
        }
        if (Math.abs(f.daysAgo - fir.daysAgo) <= 3) {
          s += 1;
          why.push("temporal cluster");
        }
        return { f, s, why };
      })
      .filter((x) => x.s >= 4);
    scored.sort((a, b) => b.s - a.s || a.f.daysAgo - b.f.daysAgo);
    return scored.slice(0, 8);
  }, [scope, fir]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDossierPdf({
        fir,
        filterLabel,
        typology,
        associates: assoc,
        evidence: ev.map((e) => ({ label: e.label, detail: e.detail, status: e.status })),
        timeline: tl,
        related,
      });
    } finally {
      setExporting(false);
    }
  };

  const collected = ev.filter((e) => e.status === "Collected").length;

  const tabs: { k: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { k: "overview", label: "Overview", icon: <FileText className="h-3.5 w-3.5" /> },
    {
      k: "suspects",
      label: "Suspect Cards",
      icon: <Users className="h-3.5 w-3.5" />,
      badge: (fir.suspect ? 1 : 0) + assoc.length,
    },
    {
      k: "evidence",
      label: "Evidence",
      icon: <FlaskConical className="h-3.5 w-3.5" />,
      badge: collected,
    },
    { k: "timeline", label: "Timeline", icon: <Clock className="h-3.5 w-3.5" />, badge: tl.length },
    {
      k: "related",
      label: "Related FIRs",
      icon: <Layers className="h-3.5 w-3.5" />,
      badge: related.length,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950"
      role="dialog"
      aria-modal="true"
      aria-label={`FIR dossier ${fir.id}`}
    >
      {/* header */}
      <header className="shrink-0 border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900">
        <div className="flex items-start justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Full Case Dossier
            </div>
            <h2 className="mt-0.5 truncate font-mono text-base md:text-xl font-bold text-cyan-300">
              {fir.id}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fir.date} · {fir.time}
              </span>
              <span>
                · {fir.station}, {fir.district}
              </span>
              <span>· IO {fir.io}</span>
              <StatusChip status={fir.status} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              className="hidden sm:grid h-8 w-8 place-items-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
              title="Share dossier"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="hidden sm:grid h-8 w-8 place-items-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
              title="Print dossier"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-500/50 bg-cyan-500/15 px-2.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-60"
              title="Export this dossier as PDF"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{exporting ? "Building…" : "Export PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 items-center gap-1.5 rounded-md border border-slate-700 px-2.5 text-xs text-slate-200 hover:border-cyan-500/60 hover:bg-slate-800"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 md:px-6">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.k
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && (
                <span className="rounded bg-slate-800 px-1.5 text-[10px] text-slate-300">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl space-y-4">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Typology" value={fir.crimeType} dot={FIR_TYPE_COLORS[fir.crimeType]} />
                <Kpi label="Property loss" value={`₹${fir.lossValue.toLocaleString("en-IN")}`} />
                <Kpi label="Evidence collected" value={`${collected} / ${ev.length}`} />
                <Kpi label="Persons on file" value={String((fir.suspect ? 1 : 0) + assoc.length)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Panel title="Case Synopsis" className="lg:col-span-2">
                  <p className="text-sm leading-relaxed text-slate-200">
                    On {fir.date} at approx. {fir.time} hrs, a {fir.crimeType.toLowerCase()} offence
                    was reported at <span className="text-slate-100">{fir.locality}</span> within{" "}
                    {fir.station} limits ({fir.beat}). Complainant: {fir.victim}. Property loss
                    assessed at ₹{fir.lossValue.toLocaleString("en-IN")}. Registered u/s{" "}
                    {typology.ipc}.{" "}
                    {fir.suspect
                      ? `Accused ${fir.suspect.name} (alias “${fir.suspect.alias}”) identified with ${fir.suspect.priors} prior FIR(s); ${fir.suspect.custody.toLowerCase()}.`
                      : "No accused identified; case under source development."}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Row
                      label="Scene coordinates"
                      value={`${fir.coords.lat}° N, ${fir.coords.lng}° E`}
                      mono
                    />
                    <Row label="Legal sections" value={typology.ipc} mono />
                    <Row label="Offence group" value={typology.group} />
                    <Row label="Typical MO window" value={typology.window} />
                  </div>
                </Panel>
                <div className="space-y-4">
                  <Panel title="Risk Assessment">
                    {fir.suspect ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                              style={{ width: `${fir.suspect.risk}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-red-300">{fir.suspect.risk}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Recidivism for this typology: {typology.recidivism}% · state clearance{" "}
                          {typology.clearance}%.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Unidentified accused — risk scoring deferred. Typology recidivism{" "}
                        {typology.recidivism}%.
                      </p>
                    )}
                  </Panel>
                  <Panel title="Investigation Health">
                    <Row
                      label="Days since report"
                      value={fir.daysAgo === 0 ? "Today" : `${fir.daysAgo} day(s)`}
                    />
                    <Row label="CCTV status" value={fir.cctv} />
                    <Row label="Related FIRs in scope" value={String(related.length)} />
                    <Row label="Filter scope" value={filterLabel} />
                  </Panel>
                </div>
              </div>
            </>
          )}

          {tab === "suspects" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {fir.suspect ? (
                <article className="rounded-lg border border-red-500/30 bg-gradient-to-b from-red-950/25 to-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
                        Prime accused
                      </span>
                      <div className="mt-2 text-base font-bold text-slate-100">
                        {fir.suspect.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        alias “{fir.suspect.alias}” ·{" "}
                        <span className="font-mono text-cyan-400">{fir.suspect.id}</span>
                      </div>
                    </div>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-red-500/40 bg-slate-950 text-sm font-bold text-red-300">
                      {fir.suspect.risk}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <Row label="Prior FIRs" value={String(fir.suspect.priors)} />
                    <Row label="Custody" value={fir.suspect.custody} />
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    <li className="flex items-center gap-2 text-slate-200">
                      <Car className="h-3.5 w-3.5 text-purple-400" />
                      <span className="font-mono">{fir.suspect.vehicle}</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-200">
                      <Phone className="h-3.5 w-3.5 text-purple-400" />
                      <span className="font-mono">{fir.suspect.phone}</span>
                    </li>
                  </ul>
                  <p className="mt-3 border-t border-slate-800 pt-2 text-[11px] leading-relaxed text-slate-300">
                    <span className="text-slate-500">MO · </span>
                    {fir.suspect.mo}
                  </p>
                </article>
              ) : (
                <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 md:col-span-2 xl:col-span-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-semibold">No accused identified</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Case is under source development. CCTV status: {fir.cctv}. MO matched against{" "}
                    {typology.group} offender database — {typology.recidivism}% of this typology
                    involves repeat offenders.
                  </p>
                </article>
              )}

              {assoc.map((a, i) => (
                <article key={i} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded border border-slate-700 bg-slate-800/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                        Associate
                      </span>
                      <div className="mt-2 text-sm font-bold text-slate-100">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.role}</div>
                    </div>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-500/40 bg-slate-950 text-xs font-bold text-amber-300">
                      {a.risk}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <Row label="Status" value={a.state} />
                    <Row label="Prior FIRs" value={String(a.priors)} />
                    <Row label="Link basis" value={a.link} />
                  </div>
                </article>
              ))}

              <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">Victim / Complainant</span>
                </div>
                <p className="mt-2 text-sm text-slate-100">{fir.victim}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Statement recorded at {fir.station}; scene {fir.locality}.
                </p>
              </article>
            </div>
          )}

          {tab === "evidence" && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Collected" value={String(collected)} />
                <Kpi
                  label="Pending"
                  value={String(ev.filter((e) => e.status === "Pending").length)}
                />
                <Kpi
                  label="At FSL"
                  value={String(ev.filter((e) => e.status === "Sent to FSL").length)}
                />
                <Kpi
                  label="Unavailable"
                  value={String(ev.filter((e) => e.status === "Unavailable").length)}
                />
              </div>
              <Panel title="Evidence Summary">
                <ul className="divide-y divide-slate-800">
                  {ev.map((e) => (
                    <li key={e.label} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-slate-700 bg-slate-950 text-cyan-400">
                        {e.icon}
                      </span>
                      <span className="min-w-[9rem] text-xs font-semibold text-slate-100">
                        {e.label}
                      </span>
                      <span className="flex-1 text-[11px] text-slate-400">{e.detail}</span>
                      <EvidenceChip status={e.status} />
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Recovery & Seizure">
                <div className="grid gap-2 sm:grid-cols-3">
                  <Row
                    label="Loss reported"
                    value={`₹${fir.lossValue.toLocaleString("en-IN")}`}
                    mono
                  />
                  <Row label="Muddemal exhibits" value={`${1 + (hash(fir.id) % 6)} items`} />
                  <Row label="FSL reference" value={`FSL/BLR/${fir.id.slice(-4)}`} mono />
                </div>
              </Panel>
            </>
          )}

          {tab === "timeline" && (
            <Panel title="Case Timeline · Investigation Events">
              <ol className="relative ml-3 border-l border-slate-800">
                {tl.map((e, i) => (
                  <li key={i} className="relative pb-5 pl-6 last:pb-0">
                    <span
                      className={`absolute -left-[9px] top-0.5 grid h-4 w-4 place-items-center rounded-full ${e.done ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500"}`}
                    >
                      {e.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${e.done ? "text-slate-100" : "text-slate-400"}`}
                      >
                        {e.label}
                      </span>
                      <span className="rounded border border-slate-700 px-1.5 text-[10px] text-slate-400">
                        {e.day === 0 ? "Day 0" : `Day +${e.day}`}
                      </span>
                      {!e.done && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-300">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{e.detail}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                <Gavel className="h-3.5 w-3.5 text-cyan-400" /> Current stage: {fir.status} ·
                reported {fir.daysAgo === 0 ? "today" : `${fir.daysAgo} day(s) ago`}
              </div>
            </Panel>
          )}

          {tab === "related" && (
            <Panel title={`Related FIRs · within current filters (${filterLabel})`}>
              {related.length ? (
                <ul className="space-y-2">
                  {related.map(({ f, why }) => (
                    <li key={f.id + f.time}>
                      <button
                        onClick={() => onOpenFir(f)}
                        className="w-full rounded-md border border-slate-800 bg-slate-900/60 p-2.5 text-left transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <FileText className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="font-mono text-cyan-200">{f.id}</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-200">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: FIR_TYPE_COLORS[f.crimeType] }}
                            />
                            {f.crimeType}
                          </span>
                          <span className="text-slate-400">{f.date}</span>
                          <span className="text-slate-400">
                            · {f.locality}, {f.station}
                          </span>
                          <span className="ml-auto text-slate-300">
                            {f.suspect ? f.suspect.name : "Unidentified"}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {why.map((w) => (
                            <span
                              key={w}
                              className="rounded border border-slate-700 bg-slate-950/70 px-1.5 py-0.5 text-[10px] text-slate-400"
                            >
                              {w}
                            </span>
                          ))}
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                            <IndianRupee className="h-3 w-3" />
                            {f.lossValue.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  No linked FIRs within the active filter scope. Widen the district, typology or
                  date range to surface cross-jurisdiction links.
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" /> Linkage weighted by accused
                identity, station, locality, typology and temporal proximity.
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-800 bg-slate-900/60 p-4 ${className}`}>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Kpi({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-100">
        {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/70 py-1 text-xs last:border-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className={`text-right text-slate-100 ${mono ? "font-mono text-[11px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EvidenceChip({ status }: { status: Evidence["status"] }) {
  const map: Record<Evidence["status"], string> = {
    Collected: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    "Sent to FSL": "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    Unavailable: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
