import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import React, { lazy, Suspense, useMemo, useState } from "react";
import {
  Shield,
  Activity,
  MapPin,
  Network,
  Brain,
  Sparkles,
  Search,
  Bell,
  Radio,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Car,
  Phone,
  Target,
  ChevronRight,
  X,
  Send,
  Zap,
  Eye,
  Filter,
  Calendar,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import {
  useLanguage,
  DISTRICT_NAMES_KN,
  CRIME_TYPE_NAMES_KN,
} from "@/context/language-context";

import { CrimeFrequencyDashboard } from "@/components/crime-frequency-dashboard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
} from "recharts";
import { FirRegistryView } from "@/components/fir-registry";
import type { FirRecord } from "@/components/fir-registry";
import { FirDossierModal } from "@/components/fir-dossier";
import { NetworkAnalysisView } from "@/components/network-analysis";
import type { MapLayers } from "@/components/karnataka-map";
import {
  useFirs,
  useSuspects,
  useHotspots,
  usePoliceStations,
  type Fir,
  type PoliceStation,
} from "@/hooks/use-ksp-data";
import { useKspRealtime } from "@/hooks/use-ksp-realtime";
import { toFirRecord } from "@/lib/fir-adapter";
import {
  computeKpi,
  computeTrend,
  computeTypology,
  computeDistrictBars,
  computeStationAlerts,
  computeMatrix,
  inr,
} from "@/lib/ksp-analytics";

const KarnatakaMap = lazy(() => import("@/components/karnataka-map"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSP-INTELLINET | SCRB Command Center" },
      {
        name: "description",
        content:
          "Strategic Crime Intelligence & Analytics Platform for Karnataka State Police and the State Crime Records Bureau.",
      },
      { property: "og:title", content: "KSP-INTELLINET | SCRB Command Center" },
      {
        property: "og:description",
        content:
          "Real-time crime intelligence, spatiotemporal hotspot mapping, link analysis, and predictive analytics for Karnataka Police.",
      },
    ],
  }),
  component: Index,
});

/* ============================== SYNTHETIC KARNATAKA DATASET ============================== */

const DISTRICTS = [
  "All Districts",
  "Bengaluru Urban",
  "Mysuru",
  "Hubballi-Dharwad",
  "Mangaluru",
  "Belagavi",
  "Kalaburagi",
] as const;

const STATIONS: Record<string, string[]> = {
  "Bengaluru Urban": [
    "Whitefield PS",
    "Koramangala PS",
    "Cybercrime PS",
    "Yeshwanthpur PS",
    "HSR Layout PS",
  ],
  Mysuru: ["Devaraja PS", "V.V. Puram PS", "Nazarbad PS"],
  "Hubballi-Dharwad": ["Vidyanagar PS", "Gokul Road PS"],
  Mangaluru: ["Bunder PS", "Pandeshwar PS", "Kadri PS"],
  Belagavi: ["Camp PS", "Shahapur PS"],
  Kalaburagi: ["Brahmapur PS", "Roza PS"],
};

const CRIME_TYPES = [
  "Chain Snatching",
  "Cyber Fraud",
  "Burglary",
  "Organized Extortion",
  "Vehicle Theft",
  "Assault",
] as const;
type CrimeType = (typeof CRIME_TYPES)[number];

const TYPE_COLORS: Record<CrimeType, string> = {
  "Chain Snatching": "#f97316",
  "Cyber Fraud": "#06b6d4",
  Burglary: "#a855f7",
  "Organized Extortion": "#ef4444",
  "Vehicle Theft": "#eab308",
  Assault: "#ec4899",
};

const TICKER = [
  "ALERT: Cyber Fraud spike +45% Whitefield PS",
  "BOLO: KA-05-MJ-4471 (Black Pulsar 220) — repeat two-wheeler theft ring, Bengaluru South",
  "SITREP: Organized extortion cell active on Mangaluru coastal belt",
  "PREDICTIVE: High-risk beat — Devaraja Market (Fri 22:00 – Sat 02:00)",
];

const SUSPECTS = [
  {
    id: "S-1042",
    name: "Ravi K.",
    alias: "Chikka",
    district: "Bengaluru Urban",
    station: "Whitefield PS",
    mo: "Two-wheeler theft using master key between 02:00 – 04:00",
    firs: ["FIR/WFD/2024/2211", "FIR/KOR/2024/0442", "FIR/YPR/2023/1188"],
    vehicle: "KA-05-MJ-4471 (Pulsar 220)",
    phone: "+91-98•••••231",
    risk: 92,
  },
  {
    id: "S-2213",
    name: "Imran S.",
    alias: "Choti",
    district: "Mysuru",
    station: "Devaraja PS",
    mo: "Chain snatching on two-wheeler near temple exits, evening prayer hours",
    firs: ["FIR/DVR/2024/0781", "FIR/VVP/2024/0122"],
    vehicle: "KA-09-HG-2210 (Splendor)",
    phone: "+91-90•••••014",
    risk: 81,
  },
  {
    id: "S-3390",
    name: "Prakash D.",
    alias: "PD",
    district: "Mangaluru",
    station: "Bunder PS",
    mo: "Extortion calls to small traders using rotating SIMs",
    firs: ["FIR/BUN/2024/0339", "FIR/PDS/2024/0210", "FIR/KDR/2024/0090"],
    vehicle: "—",
    phone: "+91-70•••••887",
    risk: 88,
  },
  {
    id: "S-4471",
    name: "Satish M.",
    alias: "Sattu",
    district: "Bengaluru Urban",
    station: "Cybercrime PS",
    mo: "OTP phishing via fake KYC calls impersonating banks",
    firs: ["FIR/CYB/2024/1120", "FIR/CYB/2024/1201"],
    vehicle: "—",
    phone: "+91-96•••••402",
    risk: 76,
  },
];

const ANOMALIES = [
  {
    id: "AN-01",
    text: "Unusual midnight commercial break-ins in low-crime rural belt (Chincholi Taluk)",
    severity: "high",
    ts: "02:14",
  },
  {
    id: "AN-02",
    text: "Cyber fraud call volume 3.8σ above baseline — Cybercrime PS",
    severity: "critical",
    ts: "09:47",
  },
  {
    id: "AN-03",
    text: "Chain-snatching cluster shifted from evening to afternoon window — Devaraja PS",
    severity: "medium",
    ts: "14:03",
  },
  {
    id: "AN-04",
    text: "Repeat vehicle KA-05-MJ-4471 pinged across 3 sub-divisions in 6 hours",
    severity: "high",
    ts: "23:31",
  },
];

// Deterministic pseudo-random for reproducibility
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ============================== APP ============================== */

type ViewKey =
  "overview" | "crime-frequency" | "geo" | "network" | "predictive" | "copilot" | "records";

function Index() {
  const [view, setView] = useState<ViewKey>("overview");
  const [district, setDistrict] = useState<string>("All Districts");
  const [crimeType, setCrimeType] = useState<string>("All Types");
  const [dateRange, setDateRange] = useState<string>("Last 7 days");
  const filters = { district, crimeType, dateRange };
  const { data: firs = [] } = useFirs(filters);
  const { data: suspects = [] } = useSuspects(district);
  const { connected, lastEventAt } = useKspRealtime();
  const { lang, t } = useLanguage();

  const kpi = useMemo(() => computeKpi(firs, suspects), [firs, suspects]);
  const trend14 = useMemo(() => computeTrend(firs), [firs]);
  const typologyPie = useMemo(() => computeTypology(firs), [firs]);
  const districtBars = useMemo(() => computeDistrictBars(firs), [firs]);
  const alerts = useMemo(() => computeStationAlerts(firs), [firs]);
  const matrix = useMemo(() => computeMatrix(firs), [firs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <TopBar
        district={district}
        setDistrict={setDistrict}
        crimeType={crimeType}
        setCrimeType={setCrimeType}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <Ticker />
      <div className="flex border-b border-slate-200 bg-white px-4 py-1.5 text-[11px] text-slate-600 md:px-6">
        <span>
          {firs.length} {t.firsInWindow}
        </span>
      </div>
      <div className="flex">
        <Sidebar view={view} setView={setView} />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-x-hidden">
          <MobileModuleNav view={view} setView={setView} />
          {view === "overview" && (
            <OverviewView
              kpi={kpi}
              trend14={trend14}
              typologyPie={typologyPie}
              districtBars={districtBars}
              alerts={alerts}
              onNavigate={(v) => setView(v)}
            />
          )}
          {view === "crime-frequency" && (
            <CrimeFrequencyDashboard initialDistrict={district} initialCrimeType={crimeType} />
          )}
          {view === "geo" && <GeoView filters={filters} firs={firs} matrix={matrix} />}
          {view === "network" && (
            <>
              <SectionHeader
                eyebrow="Module 03"
                title={lang === "kn" ? "ಅಪರಾಧ ಜಾಲ ಮತ್ತು ಲಿಂಕ್ ವಿಶ್ಲೇಷಣೆ" : "Criminological Network & Link Analysis"}
                subtitle={t.module03Subtitle}
              />
              <NetworkAnalysisView
                district={district}
                crimeType={crimeType}
                dateRange={dateRange}
              />
            </>
          )}
          {view === "predictive" && <PredictiveView />}
          {view === "copilot" && <CopilotView />}
          {view === "records" && (
            <FirRegistryView district={district} crimeType={crimeType} dateRange={dateRange} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ============================== LANGUAGE TOGGLE ============================== */

function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 shrink-0">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
          lang === "en"
            ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <span>🇬🇧</span> English
      </button>
      <button
        type="button"
        onClick={() => setLang("kn")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
          lang === "kn"
            ? "bg-amber-700 text-white font-bold shadow-xs"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <span>🇮🇳</span> ಕನ್ನಡ
      </button>
    </div>
  );
}

/* ============================== TOP BAR ============================== */

function TopBar({
  district,
  setDistrict,
  crimeType,
  setCrimeType,
  dateRange,
  setDateRange,
}: {
  district: string;
  setDistrict: (v: string) => void;
  crimeType: string;
  setCrimeType: (v: string) => void;
  dateRange: string;
  setDateRange: (v: string) => void;
}) {
  const { t, translateDistrict, translateCrimeType } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-amber-600 to-amber-800 shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              {t.deptName}
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              {t.appTitle} <span className="text-amber-700">·</span> {t.commandCenter}
            </h1>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <LanguageToggle />

          <FilterSelect
            icon={<MapPin className="h-3.5 w-3.5" />}
            value={district}
            onChange={setDistrict}
            options={[...DISTRICTS]}
            formatter={translateDistrict}
          />
          <FilterSelect
            icon={<Filter className="h-3.5 w-3.5" />}
            value={crimeType}
            onChange={setCrimeType}
            options={["All Types", ...CRIME_TYPES]}
            formatter={translateCrimeType}
          />
          <FilterSelect
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={dateRange}
            onChange={setDateRange}
            options={["Last 24 hours", "Last 7 days", "Last 30 days", "Last 90 days"]}
          />
          <button
            title="Alerts"
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50 transition-colors"
          >
            <Bell className="h-4 w-4 text-rose-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
  formatter,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  formatter?: (v: string) => string;
}) {
  return (
    <label className="group relative flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 pl-2.5 pr-1 py-1.5 hover:border-blue-400 transition-colors cursor-pointer">
      <span className="text-slate-500 group-hover:text-blue-600 transition-colors">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent pr-6 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-white text-slate-900">
            {formatter ? formatter(o) : o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
    </label>
  );
}

function Ticker() {
  return (
    <div className="flex items-center gap-3 border-b border-rose-200 bg-rose-50/80 px-4 py-1.5 overflow-hidden">
      <span className="flex items-center gap-1.5 rounded bg-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-xs">
        <AlertTriangle className="h-3 w-3" /> Alert
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap animate-[ticker_45s_linear_infinite] text-xs font-medium text-rose-950">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <Radio className="h-3 w-3 text-rose-600" /> {t}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ============================== SIDEBAR & MODULES ============================== */

function useModules() {
  const { t } = useLanguage();
  return [
    { key: "overview" as ViewKey, label: t.overview, icon: <Activity className="h-4 w-4" />, num: 1 },
    { key: "crime-frequency" as ViewKey, label: t.crimeFrequency, icon: <BarChart3 className="h-4 w-4" />, num: 2 },
    { key: "geo" as ViewKey, label: t.geoHeatmap, icon: <MapPin className="h-4 w-4" />, num: 3 },
    { key: "network" as ViewKey, label: t.networkAnalysis, icon: <Network className="h-4 w-4" />, num: 4 },
    { key: "predictive" as ViewKey, label: t.predictiveAnalytics, icon: <Brain className="h-4 w-4" />, num: 5 },
    { key: "copilot" as ViewKey, label: t.aiCopilot, icon: <Sparkles className="h-4 w-4" />, num: 6 },
    { key: "records" as ViewKey, label: t.firRegistry, icon: <FileText className="h-4 w-4" />, num: 7 },
  ];
}

function Sidebar({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
  const { lang, t } = useLanguage();
  const items = useModules();

  return (
    <aside className="sticky top-[97px] hidden md:flex h-[calc(100vh-97px)] w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-3">
      <div className="mb-2 px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {lang === "kn" ? "ಕಮಾಂಡ್ ಮಾಡ್ಯೂಲ್‌ಗಳು" : "Command Modules"}
      </div>
      <nav className="space-y-1">
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className={`group flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all ${
                active
                  ? "border-amber-300 bg-amber-50/80 text-amber-950 font-bold shadow-xs border-l-4 border-l-amber-700"
                  : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded text-[10px] font-bold ${
                  active
                    ? "bg-amber-700 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}
              >
                {it.num}
              </span>
              {it.icon}
              <span className="font-semibold">{it.label}</span>
              {active && <ChevronRight className="ml-auto h-4 w-4 text-amber-700" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <Users className="h-3.5 w-3.5 text-blue-600" />
          <span>{lang === "kn" ? "ಅಧಿವೇಶನ: ಎಸ್‌ಸಿಆರ್‌ಬಿ ಕಮಾಂಡರ್" : "Session: SCRB Cmdr."}</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {lang === "kn" ? "ಮಟ್ಟ-1 · ಬೆಂಗಳೂರು ಪ್ರಧಾನ ಕಛೇರಿ" : "Clearance: TIER-1 · Bengaluru HQ"}
        </div>
      </div>
    </aside>
  );
}

function MobileModuleNav({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
  const modules = useModules();
  return (
    <nav className="md:hidden -mx-1 flex gap-2 overflow-x-auto pb-1">
      {modules.map((it) => {
        const active = view === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setView(it.key)}
            className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ============================== OVERVIEW VIEW ============================== */

function OverviewView({
  kpi,
  trend14,
  typologyPie,
  districtBars,
  alerts,
  onNavigate,
}: {
  kpi: ReturnType<typeof computeKpi>;
  trend14: Record<string, unknown>[];
  typologyPie: Record<string, unknown>[];
  districtBars: Record<string, unknown>[];
  alerts: { station: string; district: string; type: string; delta: number; count: number }[];
  onNavigate?: (v: ViewKey) => void;
}) {
  const { lang, t } = useLanguage();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 via-white to-blue-50 border border-slate-200 p-4 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-amber-700" />
            <span>{lang === "kn" ? "ಸಂವಾದಾತ್ಮಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "Interactive Recharts Dashboard"}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {lang === "kn" ? "ಅಪರಾಧ ಪ್ರಕಾರಗಳ ಆವರ್ತನ ಮತ್ತು ವರ್ಗೀಕರಣ ವಿಶ್ಲೇಷಣೆ" : "Crime Type Frequency & Typology Analytics"}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {lang === "kn"
              ? "ಎಫ್‌ಐಆರ್ ವರದಿ ದರಗಳು, ಆಸ್ತಿ ನಷ್ಟ ಮತ್ತು ಸಮಯ ಆಧಾರಿತ ಪ್ರವೃತ್ತಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ."
              : "Visualize FIR reporting frequency, property loss metrics, temporal trend lines, and multi-dimensional radar profiles."}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("crime-frequency")}
            className="shrink-0 flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>{lang === "kn" ? "ಆವರ್ತನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ" : "Open Frequency Dashboard"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <SectionHeader
        eyebrow="Module 01"
        title={lang === "kn" ? "ಕಾರ್ಯನಿರ್ವಾಹಕ ಕಮಾಂಡ್ ಅವಲೋಕನ" : "Executive Command Overview"}
        subtitle={t.module01Subtitle}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label={lang === "kn" ? "ಒಟ್ಟು ಎಫ್‌ಐಆರ್‌ಗಳು" : "Total FIRs"}
          value={kpi.totalFIRs.toLocaleString("en-IN")}
          delta="+3.2%"
          positive
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiCard
          label={lang === "kn" ? "ವಿಲೇವಾರಿಯಾದ ಪ್ರಕರಣಗಳು" : "Cases Resolved"}
          value={kpi.resolved.toLocaleString("en-IN")}
          delta="+1.8%"
          positive
          icon={<Shield className="h-4 w-4" />}
        />
        <KpiCard
          label={lang === "kn" ? "ತನಿಖೆಯಲ್ಲಿರುವ ಪ್ರಕರಣಗಳು" : "Open Investigations"}
          value={kpi.openCases.toLocaleString("en-IN")}
          delta="-0.6%"
          positive
          icon={<Eye className="h-4 w-4" />}
        />
        <KpiCard
          label={lang === "kn" ? "ಮರು ಅಪರಾಧಿಗಳು" : "Repeat Offenders"}
          value={kpi.repeatOffenders}
          delta="live"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label={lang === "kn" ? "ಸರಾಸರಿ ಶಂಕಿತ ಅಪಾಯ" : "Avg Suspect Risk"}
          value={`${kpi.riskIndex}/100`}
          delta="live"
          icon={<Target className="h-4 w-4" />}
          tone="warn"
        />
        <KpiCard
          label={t.totalPropertyLoss}
          value={inr(kpi.propertyLoss)}
          delta={`${kpi.detectionRate}% linked`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="14-Day Crime Trend"
          subtitle="Rolling FIR volume by typology"
        >
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={trend14} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={darkTooltip} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#334155" }} />
                <Line
                  type="monotone"
                  dataKey="Chain Snatching"
                  stroke={TYPE_COLORS["Chain Snatching"]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Cyber Fraud"
                  stroke={TYPE_COLORS["Cyber Fraud"]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Burglary"
                  stroke={TYPE_COLORS["Burglary"]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Vehicle Theft"
                  stroke={TYPE_COLORS["Vehicle Theft"]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Emerging Trend Alerts" subtitle="Real-time station-level spikes">
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={`${a.station}-${a.type}`}
                className="relative overflow-hidden rounded-md border border-rose-200 bg-rose-50/60 p-3"
              >
                <span className="absolute -left-px top-0 h-full w-1 bg-rose-600" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      {a.district} · {a.station}
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-slate-900">
                      +{a.delta}% <span className="text-rose-700">{a.type}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {a.count} FIRs in current filter window
                    </div>
                  </div>
                  <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Crime Typology Breakdown" subtitle="Distribution across categories">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={typologyPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {typologyPie.map((e, i) => (
                    <Cell
                      key={i}
                      fill={TYPE_COLORS[e.name as CrimeType]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={darkTooltip} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#334155" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="District Load — Offense Category"
          subtitle="FIRs registered, current window"
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={districtBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="district" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={darkTooltip} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#334155" }} />
                <Bar dataKey="Property" stackId="a" fill="#0284c7" />
                <Bar dataKey="Cyber" stackId="a" fill="#9333ea" />
                <Bar dataKey="Bodily" stackId="a" fill="#e11d48" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ============================== GEO VIEW ============================== */

function GeoView({
  filters,
  firs,
  matrix,
}: {
  filters: { district: string; crimeType: string; dateRange: string };
  firs: Fir[];
  matrix: number[][];
}) {
  const [hour, setHour] = useState(20);
  const [layers, setLayers] = useState<MapLayers>({
    heat: true,
    stations: true,
    incidents: true,
    cluster: true,
  });
  const [intensity, setIntensity] = useState(1);
  const [selected, setSelected] = useState<FirRecord | null>(null);
  const { data: hotspots = [] } = useHotspots(filters);
  const { data: stations = [] } = usePoliceStations(filters.district);
  const { data: suspects = [] } = useSuspects(filters.district);

  const suspectMap = useMemo(() => new Map(suspects.map((s) => [s.suspect_code, s])), [suspects]);
  const scope = useMemo(() => firs.map((f) => toFirRecord(f, suspectMap)), [firs, suspectMap]);
  const openFir = (f: Fir) => setSelected(toFirRecord(f, suspectMap));
  const openStation = (s: PoliceStation) => {
    const latest = firs
      .filter((f) => f.station_name === s.name)
      .sort((a, b) => (a.incident_date < b.incident_date ? 1 : -1))[0];
    if (latest) openFir(latest);
  };

  return (
    <>
      <SectionHeader
        eyebrow="Module 02"
        title="Geospatial Hotspot & Trend Map"
        subtitle="Spatiotemporal density across Karnataka"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="Karnataka Live Hotspot Map"
          subtitle={`Heat overlays + police stations · ${String(hour).padStart(2, "0")}:00 hrs`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(
              [
                ["heat", "Heat overlay"],
                ["stations", "Police stations"],
                ["incidents", "Incidents"],
                ["cluster", "Cluster markers"],
              ] as [keyof MapLayers, string][]
            ).map(([k, label]) => (
              <button
                key={String(k)}
                onClick={() => setLayers((l: MapLayers) => ({ ...l, [k]: !l[k] }))}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  layers[k]
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
              Heat intensity
              <input
                type="range"
                min={0.2}
                max={2}
                step={0.1}
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                className="w-28 accent-amber-500"
              />
              <span className="w-8 font-mono text-amber-300">{intensity.toFixed(1)}x</span>
            </label>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950">
            <ClientOnly fallback={<div className="h-full w-full bg-slate-950" />}>
              <Suspense
                fallback={
                  <div className="grid h-full place-items-center text-xs text-slate-500">
                    Loading map…
                  </div>
                }
              >
                <KarnatakaMap
                  hotspots={hotspots}
                  stations={stations}
                  firs={firs}
                  hour={hour}
                  layers={layers}
                  intensity={intensity}
                  onSelectFir={openFir}
                  onSelectStation={openStation}
                />
              </Suspense>
            </ClientOnly>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Click any incident dot, cluster or station marker to open the full FIR dossier for the
            current filters.
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>24-Hour Timeline · Drag to visualize density shift</span>
              <span className="font-mono font-semibold text-cyan-400">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Peak Hotspots (Live)" subtitle="Ranked by recorded intensity">
            <ul className="divide-y divide-slate-800">
              {hotspots.slice(0, 6).map((h, i) => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded bg-slate-800 text-xs font-bold text-cyan-400">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-100">{h.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {h.dominant_crime_type} · {h.incident_count} incidents
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-red-400" />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="7×24 Crime Matrix Heatmap" subtitle="FIR counts by weekday and hour">
            <TemporalHeatmap matrix={matrix} />
          </Panel>
        </div>
      </div>

      {selected && (
        <FirDossierModal
          fir={selected}
          scope={scope}
          filterLabel={`${filters.district} · ${filters.crimeType} · ${filters.dateRange}`}
          onOpenFir={(f) => setSelected(f)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function TemporalHeatmap({ matrix }: { matrix: number[][] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(1, ...matrix.flat());
  const data = matrix.map((row) => row.map((v) => v / max));
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "auto repeat(24, minmax(0, 1fr))" }}
      >
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-center text-[8px] text-slate-500">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}
        {data.map((row, d) => (
          <React.Fragment key={`row-${d}`}>
            <div key={`l${d}`} className="pr-1 text-right text-[10px] text-slate-400">
              {days[d]}
            </div>
            {row.map((v, h) => (
              <div
                key={`${d}-${h}`}
                title={`${days[d]} ${h}:00 · ${(v * 100).toFixed(0)}`}
                className="aspect-square rounded-[2px]"
                style={{ background: `rgba(239,68,68,${0.08 + v * 0.9})` }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        Peak: <span className="text-red-400 font-semibold">Fri 22:00 – Sat 02:00</span>
      </div>
    </div>
  );
}

/* ============================== NETWORK VIEW ============================== */

function NetworkView({
  onSelectSuspect,
}: {
  onSelectSuspect: (s: (typeof SUSPECTS)[number]) => void;
}) {
  // Node layout
  const nodes = useMemo(
    () => [
      { id: "S-1042", label: "Ravi K.", type: "suspect", x: 300, y: 200 },
      { id: "S-2213", label: "Imran S.", type: "suspect", x: 640, y: 180 },
      { id: "S-3390", label: "Prakash D.", type: "suspect", x: 500, y: 380 },
      { id: "S-4471", label: "Satish M.", type: "suspect", x: 200, y: 400 },
      { id: "V-01", label: "Victim FIR/WFD/2211", type: "victim", x: 180, y: 100 },
      { id: "V-02", label: "Victim FIR/DVR/0781", type: "victim", x: 760, y: 100 },
      { id: "V-03", label: "Victim FIR/BUN/0339", type: "victim", x: 620, y: 470 },
      { id: "V-04", label: "Victim FIR/CYB/1120", type: "victim", x: 90, y: 320 },
      { id: "L-01", label: "Whitefield Hotspot", type: "location", x: 400, y: 90 },
      { id: "L-02", label: "Devaraja Market", type: "location", x: 700, y: 300 },
      { id: "T-01", label: "KA-05-MJ-4471", type: "tag", x: 420, y: 300 },
      { id: "T-02", label: "SIM +91-70•••887", type: "tag", x: 380, y: 470 },
      { id: "T-03", label: "MO: Master Key", type: "tag", x: 260, y: 300 },
    ],
    [],
  );
  const edges = [
    ["S-1042", "V-01"],
    ["S-1042", "L-01"],
    ["S-1042", "T-01"],
    ["S-1042", "T-03"],
    ["S-2213", "V-02"],
    ["S-2213", "L-02"],
    ["S-2213", "T-01"],
    ["S-3390", "V-03"],
    ["S-3390", "T-02"],
    ["S-3390", "L-02"],
    ["S-4471", "V-04"],
    ["S-4471", "T-03"],
    ["T-01", "L-01"],
    ["T-01", "L-02"],
  ] as const;

  const typeStyle: Record<string, { fill: string; ring: string }> = {
    suspect: { fill: "#ef4444", ring: "rgba(239,68,68,0.35)" },
    victim: { fill: "#3b82f6", ring: "rgba(59,130,246,0.3)" },
    location: { fill: "#f97316", ring: "rgba(249,115,22,0.3)" },
    tag: { fill: "#a855f7", ring: "rgba(168,85,247,0.3)" },
  };

  return (
    <>
      <SectionHeader
        eyebrow="Module 03"
        title="Criminological Network & Link Analysis"
        subtitle="2nd-degree association graph across FIRs, MOs, and jurisdictions"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="Link Analysis Graph"
          subtitle="Click a red suspect node for MO profile"
        >
          <div className="relative h-[560px] w-full overflow-hidden rounded-md border border-slate-800 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_60%)]">
            <svg viewBox="0 0 900 560" className="h-full w-full">
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#334155" />
                </marker>
              </defs>
              {edges.map(([a, b], i) => {
                const na = nodes.find((n) => n.id === a)!;
                const nb = nodes.find((n) => n.id === b)!;
                return (
                  <line
                    key={i}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    stroke="#334155"
                    strokeWidth="1.2"
                    markerEnd="url(#arr)"
                  />
                );
              })}
              {nodes.map((n) => {
                const s = typeStyle[n.type];
                const suspect = n.type === "suspect";
                const r = suspect ? 20 : n.type === "location" ? 16 : 14;
                const suspectObj = SUSPECTS.find((x) => x.id === n.id);
                return (
                  <g
                    key={n.id}
                    className={suspect ? "cursor-pointer" : ""}
                    onClick={() => suspectObj && onSelectSuspect(suspectObj)}
                  >
                    <circle cx={n.x} cy={n.y} r={r + 6} fill={s.ring} />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r}
                      fill={s.fill}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {suspect && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r + 10}
                        fill="none"
                        stroke={s.fill}
                        strokeOpacity="0.35"
                      >
                        <animate
                          attributeName="r"
                          values={`${r + 6};${r + 16};${r + 6}`}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.5;0;0.5"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <text x={n.x} y={n.y + r + 12} textAnchor="middle" fontSize="10" fill="#cbd5e1">
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded bg-slate-950/85 px-2 py-1 text-[10px] text-slate-300 ring-1 ring-slate-700">
              <Legend2 color="#ef4444" label="Suspect" />
              <Legend2 color="#3b82f6" label="Victim" />
              <Legend2 color="#f97316" label="Location" />
              <Legend2 color="#a855f7" label="Vehicle / SIM / MO" />
            </div>
          </div>
        </Panel>

        <Panel title="Hidden Association Detector" subtitle="Cross-jurisdiction 2nd-degree ties">
          <ul className="space-y-3">
            <AssocItem
              a="Ravi K. (S-1042)"
              b="Imran S. (S-2213)"
              via="Shared vehicle KA-05-MJ-4471"
              strength={0.86}
            />
            <AssocItem
              a="Prakash D. (S-3390)"
              b="Imran S. (S-2213)"
              via="Common node · Devaraja Market"
              strength={0.62}
            />
            <AssocItem
              a="Ravi K. (S-1042)"
              b="Satish M. (S-4471)"
              via="MO overlap · Master Key"
              strength={0.71}
            />
          </ul>

          <div className="mt-4 rounded-md border border-cyan-500/25 bg-cyan-500/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Zap className="h-3.5 w-3.5" /> Syndicate Hypothesis
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Ravi K., Imran S., and Satish M. appear to operate a coordinated two-wheeler theft
              cell across Bengaluru–Mysuru corridor. Confidence{" "}
              <span className="font-semibold text-cyan-300">76%</span>.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Repeat Offender Registry" subtitle="Click a row to open MO profile">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="py-2 px-3">ID</th>
                <th className="px-3">Suspect</th>
                <th className="px-3">Station</th>
                <th className="px-3">FIRs</th>
                <th className="px-3">Vehicle / SIM</th>
                <th className="px-3">Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {SUSPECTS.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSuspect(s)}
                  className="cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-xs text-cyan-400">{s.id}</td>
                  <td className="px-3 font-medium text-slate-100">
                    {s.name} <span className="text-slate-500">· {s.alias}</span>
                  </td>
                  <td className="px-3 text-slate-300">{s.station}</td>
                  <td className="px-3 text-slate-400">{s.firs.length}</td>
                  <td className="px-3 font-mono text-xs text-slate-300">{s.vehicle}</td>
                  <td className="px-3">
                    <RiskPill value={s.risk} />
                  </td>
                  <td className="px-3 text-slate-500">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
function AssocItem({
  a,
  b,
  via,
  strength,
}: {
  a: string;
  b: string;
  via: string;
  strength: number;
}) {
  return (
    <li className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-100">{a}</span>
        <span className="text-slate-500">⇔</span>
        <span className="font-medium text-slate-100">{b}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-400">{via}</div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-red-500"
          style={{ width: `${strength * 100}%` }}
        />
      </div>
    </li>
  );
}
function RiskPill({ value }: { value: number }) {
  const tone =
    value >= 85
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : value >= 70
        ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {value}
    </span>
  );
}

/* ============================== PREDICTIVE VIEW ============================== */

function PredictiveView() {
  const socio = useMemo(() => {
    const r = seeded(3);
    return Array.from({ length: 12 }, (_, i) => ({
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
        i
      ],
      crimes: Math.round(280 + r() * 220),
      unemployment: +(6 + r() * 4).toFixed(1),
      density: Math.round(8000 + r() * 4000),
      liquor: Math.round(80 + r() * 60),
    }));
  }, []);

  const risks = [
    {
      beat: "Whitefield · Beat 7",
      type: "Cyber Fraud",
      score: 92,
      factors: ["Recent OTP scam cluster", "Weekend spike history", "High IT-park footfall"],
    },
    {
      beat: "Koramangala · Beat 3",
      type: "Chain Snatching",
      score: 84,
      factors: ["Poor street lighting", "Historic Fri-Sat pattern", "Pub-district ingress"],
    },
    {
      beat: "Devaraja Market · Beat 2",
      type: "Chain Snatching",
      score: 78,
      factors: ["Evening prayer footfall", "Two-wheeler egress lanes"],
    },
    {
      beat: "Bunder · Beat 1",
      type: "Extortion",
      score: 88,
      factors: ["Trader complaint volume ↑", "Rotating SIM traces", "Coastal transit routes"],
    },
    {
      beat: "Vidyanagar · Beat 4",
      type: "Burglary",
      score: 71,
      factors: ["Unoccupied premises count", "Rear-lane access"],
    },
    {
      beat: "Brahmapur · Beat 5",
      type: "Burglary",
      score: 68,
      factors: ["Sparse patrolling window 02–04h", "Rural connectivity"],
    },
  ];

  const radar = [
    { factor: "Youth Unemp.", A: 82 },
    { factor: "Pop. Density", A: 74 },
    { factor: "Liquor Outlets", A: 68 },
    { factor: "Unlit Zones", A: 71 },
    { factor: "Commercial Growth", A: 88 },
    { factor: "Migrant Footfall", A: 65 },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="Module 04"
        title="Sociological & AI-Driven Predictive Analytics"
        subtitle="Risk forecasting with socio-economic overlays"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="Crime vs Socio-Economic Signals"
          subtitle="12-month correlation view"
        >
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={socio}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="l" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="r" orientation="right" stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={darkTooltip} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
                <Area
                  yAxisId="l"
                  type="monotone"
                  dataKey="crimes"
                  name="Crime Rate"
                  fill="rgba(239,68,68,0.25)"
                  stroke="#ef4444"
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="unemployment"
                  name="Youth Unempl. %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="liquor"
                  name="Liquor Outlets /km²"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
                <Bar
                  yAxisId="l"
                  dataKey="density"
                  name="Pop. Density (proxy)"
                  fill="#10b981"
                  fillOpacity={0.35}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Contributing Risk Factors" subtitle="Statewide composite drivers">
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                <PolarRadiusAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                <Tooltip contentStyle={darkTooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Predictive Risk Scoring Engine" subtitle="Next 7-day high-risk beats">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {risks.map((r) => (
            <div
              key={r.beat}
              className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500">
                    {r.type}
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{r.beat}</div>
                </div>
                <RiskScore score={r.score} />
              </div>
              <div className="mt-3 space-y-1">
                {r.factors.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" /> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function RiskScore({ score }: { score: number }) {
  const stroke = score >= 85 ? "#ef4444" : score >= 70 ? "#f97316" : "#10b981";
  const c = 2 * Math.PI * 22;
  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 50 50" className="h-14 w-14 -rotate-90">
        <circle cx="25" cy="25" r="22" fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx="25"
          cy="25"
          r="22"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-100">
        {score}
      </div>
    </div>
  );
}

/* ============================== COPILOT VIEW ============================== */

function CopilotView() {
  type Msg = { who: "user" | "ai"; text: string; result?: { title: string; rows: string[] } };
  const [messages, setMessages] = useState<Msg[]>([
    {
      who: "ai",
      text: "KSP-Copilot online. Ask about suspects, hotspots, MO patterns, or beats. Try: “Show all repeat offenders operating in Mysuru using a 200cc Pulsar.”",
    },
  ]);
  const [input, setInput] = useState("");

  const ask = (q: string) => {
    if (!q.trim()) return;
    const next: Msg[] = [...messages, { who: "user", text: q }];
    // Simple rule-based synthetic responses
    const lc = q.toLowerCase();
    let result: Msg["result"];
    let reply = "Query processed. Structured results and filtered views below.";
    if (lc.includes("mysuru") && (lc.includes("pulsar") || lc.includes("200"))) {
      result = {
        title: "3 matches · Mysuru sub-division · 200cc class two-wheeler",
        rows: [
          "S-2213 · Imran S. · KA-09-HG-2210 (linked to Pulsar 220 in FIR/DVR/0781)",
          "S-1042 · Ravi K. · KA-05-MJ-4471 (cross-jurisdiction Bengaluru↔Mysuru)",
          "S-8891 · Rehman P. · KA-09-KA-1120 (BOLO active, chain snatching)",
        ],
      };
    } else if (lc.includes("cyber")) {
      result = {
        title: "Cyber Fraud · 7-day surge · Bengaluru Urban",
        rows: [
          "Whitefield PS · +45% (OTP-phishing cluster)",
          "Cybercrime PS · call volume 3.8σ above baseline",
          "Top MO: Fake KYC calls impersonating HDFC/SBI",
        ],
      };
    } else if (lc.includes("hotspot") || lc.includes("beat")) {
      result = {
        title: "Predicted High-Risk Beats · Next 72h",
        rows: [
          "Whitefield · Beat 7 · Cyber Fraud · Risk 92",
          "Bunder · Beat 1 · Extortion · Risk 88",
          "Koramangala · Beat 3 · Chain Snatching · Risk 84",
        ],
      };
    } else {
      reply = "No structured match. Showing anomaly overview and top predicted beats as fallback.";
      result = {
        title: "Fallback · State overview",
        rows: [
          "State Risk Index: 58/100 (↑ 4)",
          "Top typology this week: Cyber Fraud (+18%)",
          "Active BOLO: KA-05-MJ-4471",
        ],
      };
    }
    next.push({ who: "ai", text: reply, result });
    setMessages(next);
    setInput("");
  };

  const suggestions = [
    "Show all repeat offenders in Mysuru using a 200cc Pulsar",
    "Where is cyber fraud spiking this week?",
    "List top predicted beats for the weekend",
  ];

  return (
    <>
      <SectionHeader
        eyebrow="Module 05"
        title="KSP-Copilot & Behavioral Anomaly Log"
        subtitle="Natural-language querying + AI anomaly detection"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="KSP-Copilot"
          subtitle="Ask in natural language. Answers ground back to FIR & suspect data."
        >
          <div className="flex h-[520px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg border p-3 ${
                      m.who === "user"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-50"
                        : "border-slate-700 bg-slate-800/60 text-slate-100"
                    }`}
                  >
                    <div className="text-xs opacity-70">
                      {m.who === "user" ? "SCRB Commander" : "KSP-Copilot"}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed">{m.text}</div>
                    {m.result && (
                      <div className="mt-3 rounded-md border border-slate-700 bg-slate-950/50 p-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
                          {m.result.title}
                        </div>
                        <ul className="mt-1.5 space-y-1">
                          {m.result.rows.map((r) => (
                            <li key={r} className="flex items-start gap-2 text-xs text-slate-200">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="mt-2 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 p-1.5 focus-within:border-cyan-500/60"
            >
              <Search className="ml-1.5 h-4 w-4 text-slate-400" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask KSP-Copilot… e.g. suspects linked to Whitefield hotspot in last 30 days"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </form>
          </div>
        </Panel>

        <Panel title="Behavioral Anomaly Log" subtitle="Patterns breaking historical baselines">
          <ul className="space-y-2">
            {ANOMALIES.map((a) => {
              const tone =
                a.severity === "critical"
                  ? "border-red-500/40 bg-red-500/10"
                  : a.severity === "high"
                    ? "border-orange-500/40 bg-orange-500/10"
                    : "border-yellow-500/30 bg-yellow-500/5";
              const dot =
                a.severity === "critical"
                  ? "bg-red-500"
                  : a.severity === "high"
                    ? "bg-orange-500"
                    : "bg-yellow-500";
              return (
                <li key={a.id} className={`rounded-md border p-3 ${tone}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                      {a.severity}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-slate-400">{a.ts}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-100 leading-snug">{a.text}</div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/* ============================== SUSPECT MODAL ============================== */

function SuspectModal({
  suspect,
  onClose,
}: {
  suspect: (typeof SUSPECTS)[number];
  onClose: () => void;
}) {
  const timeline = [
    { date: "2023-08-14", event: `${suspect.firs[0] ?? "FIR"} registered`, tag: "FIR" },
    { date: "2023-11-02", event: "Cross-jurisdiction sighting · CCTV cluster", tag: "Intel" },
    { date: "2024-02-19", event: `${suspect.firs[1] ?? "FIR"} · MO match confirmed`, tag: "FIR" },
    { date: "2024-06-08", event: "Associate arrest triggered network expansion", tag: "Ops" },
    { date: "2024-10-21", event: "Placed on BOLO · state-wide", tag: "BOLO" },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-800 bg-gradient-to-r from-red-950/60 to-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-red-500/20 ring-2 ring-red-500/40">
              <Users className="h-6 w-6 text-red-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Repeat Offender Profile
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                {suspect.name}{" "}
                <span className="text-slate-500 text-sm font-normal">
                  · alias “{suspect.alias}”
                </span>
              </h3>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                <span className="font-mono text-cyan-400">{suspect.id}</span>
                <span>· {suspect.district}</span>
                <span>· {suspect.station}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RiskScore score={suspect.risk} />
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-700 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">
              Modus Operandi
            </div>
            <p className="mt-1.5 text-sm text-slate-100 leading-relaxed">{suspect.mo}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Identifiers</div>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-slate-200">
                <Car className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-mono">{suspect.vehicle}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Phone className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-mono">{suspect.phone}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                {suspect.district} corridor
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">
              Cross-Jurisdiction FIR Links
            </div>
            <div className="flex flex-wrap gap-2">
              {suspect.firs.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-mono text-cyan-200"
                >
                  <FileText className="h-3 w-3" /> {f}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-500">
              Crime Timeline
            </div>
            <ol className="relative border-l border-slate-800 pl-4 space-y-3">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-cyan-500 ring-4 ring-slate-900" />
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">{t.date}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {t.tag}
                    </span>
                  </div>
                  <div className="text-sm text-slate-100">{t.event}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== SHARED UI ============================== */

const darkTooltip = {
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 12,
  color: "#0f172a",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
} as const;

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-800">
          {eyebrow}
        </div>
        <h2 className="mt-0.5 text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-600 font-medium">{subtitle}</p>
      </div>
      <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-medium">
        <Clock className="h-3.5 w-3.5" /> Updated live · SCRB feed
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}>
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  delta: string;
  positive?: boolean;
  icon: React.ReactNode;
  tone?: "warn";
}) {
  const deltaTone = positive
    ? "text-emerald-700"
    : tone === "warn"
      ? "text-rose-700"
      : "text-slate-600";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="text-amber-700">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className={`text-[11px] font-bold ${deltaTone}`}>{delta} vs prior</div>
    </div>
  );
}
