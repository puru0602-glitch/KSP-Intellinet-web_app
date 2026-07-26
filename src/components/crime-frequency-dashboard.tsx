import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
} from "recharts";
import {
  ShieldAlert,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Filter,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Search,
  Layers,
  Sparkles,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";
import { useFirs, useSuspects, type Fir, type KspFilters } from "@/hooks/use-ksp-data";
import { CRIME_TYPES, TYPE_COLORS, inr } from "@/lib/ksp-analytics";
import { useRunIntelligenceAnalysis, useAuditLogs } from "@/hooks/use-ksp-mutations";
import type { IntelligenceReport, AuditLogEntry } from "@/lib/ksp-backend-service";
import { DateRangePicker, getPresetDates, type DateRangeSelection } from "./date-range-picker";
import { FirStatusIndicator } from "./fir-status-indicator";
import { DashboardSearchBar } from "./dashboard-search-bar";
import { ExportCsvButton } from "./export-csv-button";
import { PrintReportButton } from "./print-report-button";
import { CustomChartTooltip } from "./custom-chart-tooltip";
import { TrendPredictionCard } from "./trend-prediction-card";
import { CrimeDensityHeatmap } from "./crime-density-heatmap";

interface CrimeFrequencyDashboardProps {
  initialDistrict?: string;
  initialCrimeType?: string;
  onSelectFir?: (fir: Fir) => void;
  className?: string;
}

const DISTRICT_LIST = [
  "All Districts",
  "Bengaluru Urban",
  "Mysuru",
  "Mangaluru",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
];

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  "Chain Snatching": "#f97316", // Orange
  "Cyber Fraud": "#06b6d4", // Cyan
  Burglary: "#a855f7", // Purple
  "Organized Extortion": "#ef4444", // Red
  "Vehicle Theft": "#eab308", // Yellow
  Assault: "#ec4899", // Pink
};

export function CrimeFrequencyDashboard({
  initialDistrict = "All Districts",
  initialCrimeType = "All Types",
  onSelectFir,
  className = "",
}: CrimeFrequencyDashboardProps) {
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [crimeTypeFilter, setCrimeTypeFilter] = useState<string>(initialCrimeType);
  const [dateSelection, setDateSelection] = useState<DateRangeSelection>({
    preset: "Last 30 Days",
    ...getPresetDates(30),
  });
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [chartMode, setChartMode] = useState<"bar" | "pie" | "trend" | "radar" | "composed">(
    "composed",
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [intelReport, setIntelReport] = useState<IntelligenceReport | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  const searchBarInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts listener ('/' to focus search, 'Ctrl+E' / 'Cmd+E' to trigger CSV export)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut '/' to focus search input if not typing in form controls
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        searchBarInputRef.current?.focus();
      }

      // Shortcut 'Ctrl+E' or 'Cmd+E' to trigger CSV Export
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        const exportBtn = document.getElementById("export-csv-btn");
        if (exportBtn) {
          exportBtn.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const intelMutation = useRunIntelligenceAnalysis();
  const { data: auditLogs = [] } = useAuditLogs();

  const filters: KspFilters = useMemo(
    () => ({
      district,
      crimeType: crimeTypeFilter,
      dateRange: dateSelection.preset,
      startDate: dateSelection.startDate,
      endDate: dateSelection.endDate,
    }),
    [district, crimeTypeFilter, dateSelection],
  );

  const { data: firs = [], isLoading } = useFirs(filters);
  const { data: suspects = [] } = useSuspects(district);

  // Comprehensive filter for FIRs by search query, status, category, and date
  const filteredFirs = useMemo(() => {
    return firs.filter((f) => {
      if (selectedCategory && f.crime_type !== selectedCategory) return false;

      // Status Filter
      if (statusFilter !== "All Statuses") {
        const s = (f.status || "").toLowerCase();
        const target = statusFilter.toLowerCase();
        if (
          !s.includes(target) &&
          !(
            target === "resolved" &&
            (s.includes("close") || s.includes("chargesheet") || s.includes("convict"))
          )
        ) {
          return false;
        }
      }

      // Comprehensive Search Query (Case ID/FIR#, complainant/IO, date, station, summary)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const firNum = (f.fir_number || "").toLowerCase();
        const summaryText = (f.summary || "").toLowerCase();
        const localityText = (f.locality || "").toLowerCase();
        const stationText = (f.station_name || "").toLowerCase();
        const ioText = (f.investigating_officer || "").toLowerCase();
        const suspectText = (f.suspect_code || "").toLowerCase();
        const dateText = (f.incident_date || "").toLowerCase();

        return (
          firNum.includes(q) ||
          summaryText.includes(q) ||
          localityText.includes(q) ||
          stationText.includes(q) ||
          ioText.includes(q) ||
          suspectText.includes(q) ||
          dateText.includes(q)
        );
      }
      return true;
    });
  }, [firs, selectedCategory, statusFilter, searchQuery]);

  // Aggregate stats per Crime Type
  const crimeTypeStats = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        name: string;
        count: number;
        totalLoss: number;
        resolvedCount: number;
        nightIncidents: number;
        suspectLinkedCount: number;
        stations: Map<string, number>;
        color: string;
      }
    >();

    // Pre-fill all standard crime types
    CRIME_TYPES.forEach((type) => {
      statsMap.set(type, {
        name: type,
        count: 0,
        totalLoss: 0,
        resolvedCount: 0,
        nightIncidents: 0,
        suspectLinkedCount: 0,
        stations: new Map<string, number>(),
        color: TYPE_COLORS[type] || DEFAULT_TYPE_COLORS[type] || "#3b82f6",
      });
    });

    firs.forEach((fir) => {
      let stat = statsMap.get(fir.crime_type);
      if (!stat) {
        stat = {
          name: fir.crime_type,
          count: 0,
          totalLoss: 0,
          resolvedCount: 0,
          nightIncidents: 0,
          suspectLinkedCount: 0,
          stations: new Map<string, number>(),
          color: TYPE_COLORS[fir.crime_type] || "#3b82f6",
        };
        statsMap.set(fir.crime_type, stat);
      }

      stat.count += 1;
      stat.totalLoss += Number(fir.loss_value || 0);

      if (
        fir.status === "Resolved" ||
        fir.status === "Chargesheeted" ||
        fir.status === "Detected"
      ) {
        stat.resolvedCount += 1;
      }

      if (fir.incident_hour >= 21 || fir.incident_hour <= 5) {
        stat.nightIncidents += 1;
      }

      if (fir.suspect_code) {
        stat.suspectLinkedCount += 1;
      }

      const stCount = stat.stations.get(fir.station_name) || 0;
      stat.stations.set(fir.station_name, stCount + 1);
    });

    const totalFirs = firs.length || 1;

    return Array.from(statsMap.values())
      .map((item) => {
        const topStationEntry = Array.from(item.stations.entries()).sort((a, b) => b[1] - a[1])[0];
        const topStation = topStationEntry
          ? `${topStationEntry[0]} (${topStationEntry[1]})`
          : "N/A";

        return {
          ...item,
          percentage: Number(((item.count / totalFirs) * 100).toFixed(1)),
          avgLoss: item.count > 0 ? Math.round(item.totalLoss / item.count) : 0,
          detectionRate: item.count > 0 ? Math.round((item.resolvedCount / item.count) * 100) : 0,
          nightPercentage:
            item.count > 0 ? Math.round((item.nightIncidents / item.count) * 100) : 0,
          suspectLinkRate:
            item.count > 0 ? Math.round((item.suspectLinkedCount / item.count) * 100) : 0,
          topStation,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [firs]);

  // Overall totals
  const overallKpi = useMemo(() => {
    const totalCount = firs.length;
    const totalLoss = firs.reduce((sum, f) => sum + Number(f.loss_value || 0), 0);
    const mostFrequent = crimeTypeStats[0] || null;
    const highestLossCrime =
      [...crimeTypeStats].sort((a, b) => b.totalLoss - a.totalLoss)[0] || null;
    const highestRiskCrime =
      [...crimeTypeStats].sort((a, b) => b.nightPercentage - a.nightPercentage)[0] || null;

    return {
      totalCount,
      totalLoss,
      mostFrequent,
      highestLossCrime,
      highestRiskCrime,
    };
  }, [firs, crimeTypeStats]);

  // Temporal trend by Crime Type over dates
  const trendData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>();

    // Get sorted unique valid dates
    const dates = Array.from(
      new Set(firs.filter((f) => Boolean(f && f.incident_date)).map((f) => f.incident_date!)),
    ).sort();

    dates.forEach((date) => {
      const displayDate =
        typeof date === "string" && date.length >= 5 ? date.slice(5) : date || "N/A";
      const row: Record<string, number | string> = { date: displayDate };
      CRIME_TYPES.forEach((ct) => {
        row[ct] = 0;
      });
      dateMap.set(date, row);
    });

    firs.forEach((f) => {
      if (f && f.incident_date && f.crime_type) {
        const row = dateMap.get(f.incident_date);
        if (row) {
          row[f.crime_type] = (Number(row[f.crime_type]) || 0) + 1;
        }
      }
    });

    return Array.from(dateMap.values());
  }, [firs]);

  // Radar data comparing Crime Types across dimensions (normalized 0-100)
  const radarData = useMemo(() => {
    if (!crimeTypeStats.length) return [];
    const maxCount = Math.max(...crimeTypeStats.map((s) => s.count), 1);
    const maxLoss = Math.max(...crimeTypeStats.map((s) => s.totalLoss), 1);

    return CRIME_TYPES.map((ct) => {
      const stat = crimeTypeStats.find((s) => s.name === ct);
      if (!stat) {
        return {
          subject: ct,
          Frequency: 0,
          FinancialLoss: 0,
          NightRatio: 0,
          DetectionRate: 0,
          SuspectLinkage: 0,
        };
      }
      return {
        subject: ct,
        Frequency: Math.round((stat.count / maxCount) * 100),
        FinancialLoss: Math.round((stat.totalLoss / maxLoss) * 100),
        NightRatio: stat.nightPercentage,
        DetectionRate: stat.detectionRate,
        SuspectLinkage: stat.suspectLinkRate,
      };
    });
  }, [crimeTypeStats]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header section with status bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span>FIR Dossier Analytics</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Recharts Frequency Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Crime Type Frequency & Typology Dashboard
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time crime frequency distribution, financial property loss metrics, and temporal
            trend analysis across Karnataka jurisdiction.
          </p>
        </div>

        {/* Global Dashboard Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* District selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:border-slate-300">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-transparent text-slate-800 font-medium outline-none cursor-pointer"
            >
              {DISTRICT_LIST.map((d) => (
                <option key={d} value={d} className="bg-white text-slate-900">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Date Range Picker Component */}
          <DateRangePicker value={dateSelection} onChange={setDateSelection} />

          {/* Crime type filter dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:border-slate-300">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            <select
              value={crimeTypeFilter}
              onChange={(e) => {
                setCrimeTypeFilter(e.target.value);
                setSelectedCategory(null);
              }}
              className="bg-transparent text-slate-800 font-medium outline-none cursor-pointer"
            >
              <option value="All Types" className="bg-white text-slate-900">
                All Crime Types
              </option>
              {CRIME_TYPES.map((ct) => (
                <option key={ct} value={ct} className="bg-white text-slate-900">
                  {ct}
                </option>
              ))}
            </select>
          </div>

          {/* CSV Statistics Export Button */}
          <ExportCsvButton
            district={district}
            dateRange={dateSelection.preset}
            firs={filteredFirs}
            crimeTypeStats={crimeTypeStats}
            variant="outline"
          />

          {/* Printable Report Button */}
          <PrintReportButton variant="outline" label="Print A4 Report" />

          {/* Backend Intelligence Engine trigger */}
          <button
            onClick={() => {
              intelMutation.mutate(
                { district, dateRange: dateSelection.preset },
                {
                  onSuccess: (report) => {
                    setIntelReport(report);
                  },
                },
              );
            }}
            disabled={intelMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-200" />
            {intelMutation.isPending ? "Analyzing..." : "Run Intel Engine"}
          </button>

          {/* Audit Log Viewer */}
          <button
            onClick={() => setIsAuditOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            Audit Trail
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total FIRs */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 relative overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Reported FIRs
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{overallKpi.totalCount}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              +12% vs last cycle
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Filter: {district}</span>
            <span>{dateSelection.preset}</span>
          </div>
          <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />
        </div>

        {/* Most Frequent Crime */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 relative overflow-hidden shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Most Frequent Crime
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 truncate block">
              {overallKpi.mostFrequent ? overallKpi.mostFrequent.name : "N/A"}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-amber-700 font-medium">
              <span>
                {overallKpi.mostFrequent ? `${overallKpi.mostFrequent.count} FIRs` : "0 FIRs"}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {overallKpi.mostFrequent ? `${overallKpi.mostFrequent.percentage}% of total` : "0%"}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Top PS: {overallKpi.mostFrequent?.topStation || "N/A"}
          </div>
          <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40" />
        </div>

        {/* Highest Financial Loss Crime */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 relative overflow-hidden shadow-xs hover:shadow-md hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Highest Property Loss
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 truncate block">
              {overallKpi.highestLossCrime ? overallKpi.highestLossCrime.name : "N/A"}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-purple-700 font-medium">
              <span>{inr(overallKpi.highestLossCrime?.totalLoss || 0)}</span>
              <span className="text-slate-300">•</span>
              <span>Avg {inr(overallKpi.highestLossCrime?.avgLoss || 0)}/FIR</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total Loss: {inr(overallKpi.totalLoss)}
          </div>
          <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40" />
        </div>

        {/* High Risk / Night Window Crime */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 relative overflow-hidden shadow-xs hover:shadow-md hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Night Window Hotspot
            </span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 truncate block">
              {overallKpi.highestRiskCrime ? overallKpi.highestRiskCrime.name : "N/A"}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-rose-700 font-medium">
              <span>
                {overallKpi.highestRiskCrime
                  ? `${overallKpi.highestRiskCrime.nightPercentage}% night FIRs`
                  : "0%"}
              </span>
              <span className="text-slate-300">•</span>
              <span>21:00 – 05:00 Window</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Suspect link rate: {overallKpi.highestRiskCrime?.suspectLinkRate || 0}%
          </div>
          <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-40" />
        </div>
      </div>

      {/* Main Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Container */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" />
                <span>Primary Recharts Analytics</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {chartMode === "composed" && "Crime Frequency vs. Financial Loss Impact"}
                {chartMode === "bar" && "FIR Frequency Count by Crime Type"}
                {chartMode === "pie" && "Crime Typology Distribution Share"}
                {chartMode === "trend" && "Daily Crime Incident Frequency Timeline"}
                {chartMode === "radar" && "Multi-Dimensional Crime Typology Profile"}
              </h3>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                onClick={() => setChartMode("composed")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  chartMode === "composed"
                    ? "bg-white text-blue-800 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Composed Bar & Line View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Composed</span>
              </button>
              <button
                onClick={() => setChartMode("bar")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  chartMode === "bar"
                    ? "bg-white text-blue-800 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Bar Chart View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bars</span>
              </button>
              <button
                onClick={() => setChartMode("pie")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  chartMode === "pie"
                    ? "bg-white text-blue-800 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Donut Pie Chart View"
              >
                <PieIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Donut</span>
              </button>
              <button
                onClick={() => setChartMode("trend")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  chartMode === "trend"
                    ? "bg-white text-blue-800 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Temporal Trend Area View"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trend</span>
              </button>
              <button
                onClick={() => setChartMode("radar")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  chartMode === "radar"
                    ? "bg-white text-blue-800 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Radar Profile View"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Radar</span>
              </button>
            </div>
          </div>

          {/* Active Chart Rendering */}
          <div className="h-[340px] w-full pt-2">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
                <Zap className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                Loading FIR dataset from database...
              </div>
            ) : chartMode === "composed" ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={crimeTypeStats}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#2563eb"
                    fontSize={11}
                    label={{
                      value: "FIR Count",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#2563eb",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#7e22ce"
                    fontSize={11}
                    tickFormatter={(v) => inr(v)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar yAxisId="left" dataKey="count" name="FIR Count" radius={[6, 6, 0, 0]}>
                    {crimeTypeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalLoss"
                    name="Property Loss (₹)"
                    stroke="#7e22ce"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#7e22ce" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : chartMode === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={crimeTypeStats}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" name="FIR Frequency" radius={[6, 6, 0, 0]}>
                    {crimeTypeStats.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : chartMode === "pie" ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crimeTypeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={true}
                  >
                    {crimeTypeStats.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: "11px", color: "#475569" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : chartMode === "trend" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomChartTooltip title="Crime Trend" />} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: "11px", color: "#475569" }}
                  />
                  {CRIME_TYPES.map((ct) => (
                    <Area
                      key={ct}
                      type="monotone"
                      dataKey={ct}
                      stackId="1"
                      stroke={TYPE_COLORS[ct] || "#3b82f6"}
                      fill={TYPE_COLORS[ct] || "#3b82f6"}
                      fillOpacity={0.3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={110} data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                  <Radar
                    name="Frequency %"
                    dataKey="Frequency"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Night Window %"
                    dataKey="NightRatio"
                    stroke="#e11d48"
                    fill="#e11d48"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="Detection Rate %"
                    dataKey="DetectionRate"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#0f172a",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: "11px", color: "#475569" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Interactive Crime Type Pill Selectors */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-between">
              <span>Filter View by Focus Category:</span>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 font-semibold hover:underline text-[11px]"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === null
                    ? "bg-blue-50 text-blue-800 border border-blue-200 font-bold"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"
                }`}
              >
                All Typologies ({firs.length})
              </button>
              {crimeTypeStats.map((item) => (
                <button
                  key={item.name}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === item.name ? null : item.name)
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedCategory === item.name
                      ? "bg-slate-900 text-white border"
                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"
                  }`}
                  style={{
                    borderColor: selectedCategory === item.name ? item.color : undefined,
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                  <span className="text-slate-500 text-[10px]">({item.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Crime Type Dossier Table / Ranking Cards */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Typology Ranking</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Crime Frequency Summary
                </h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                {crimeTypeStats.length} Types
              </span>
            </div>

            {/* List of Crime Types with Mini Progress bars */}
            <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
              {crimeTypeStats.map((item, idx) => {
                const maxCount = crimeTypeStats[0]?.count || 1;
                const barWidth = Math.round((item.count / maxCount) * 100);

                return (
                  <div
                    key={item.name}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === item.name ? null : item.name)
                    }
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedCategory === item.name
                        ? "bg-slate-100 border-blue-400 shadow-xs"
                        : "bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.count} FIRs</span>
                        <span className="text-[10px] text-slate-500">({item.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                      />
                    </div>

                    {/* Detail metadata row */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                      <div>
                        <span className="text-slate-500">Loss Impact:</span>{" "}
                        <span className="text-purple-700 font-semibold">{inr(item.totalLoss)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Detection Rate:</span>{" "}
                        <span className="text-emerald-700 font-semibold">
                          {item.detectionRate}%
                        </span>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-slate-500">Top Hotspot PS:</span>{" "}
                        <span className="text-slate-800 font-medium">{item.topStation}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
            <span>Filtered Set FIR Total:</span>
            <span className="text-blue-700 font-bold font-mono">{filteredFirs.length} Records</span>
          </div>
        </div>
      </div>

      {/* AI Trend Forecasting & Predictive Crime Frequency */}
      <TrendPredictionCard firs={filteredFirs} district={district} />

      {/* Geographical Crime Density Heatmap Canvas */}
      <CrimeDensityHeatmap firs={filteredFirs} district={district} />

      {/* Filtered FIR Dossier List preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              <span>Matching Dossiers</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Filtered FIR Dossier Records {selectedCategory ? `— ${selectedCategory}` : ""}
            </h3>
          </div>

          {/* Search bar component & Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <DashboardSearchBar
              inputRef={searchBarInputRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              matchCount={filteredFirs.length}
            />
            <ExportCsvButton
              district={district}
              dateRange={dateSelection.preset}
              firs={filteredFirs}
              crimeTypeStats={crimeTypeStats}
              variant="outline"
            />
          </div>
        </div>

        {/* Table of matching FIRs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
              <tr>
                <th className="py-2.5 px-3">FIR Number</th>
                <th className="py-2.5 px-3">Crime Typology</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Police Station</th>
                <th className="py-2.5 px-3">Loss Value</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFirs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No FIR dossier records match the current crime type, date, or search criteria.
                  </td>
                </tr>
              ) : (
                filteredFirs.slice(0, 10).map((fir) => {
                  const color =
                    TYPE_COLORS[fir.crime_type] || DEFAULT_TYPE_COLORS[fir.crime_type] || "#3b82f6";
                  return (
                    <tr
                      key={fir.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onSelectFir?.(fir)}
                    >
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">
                        {fir.fir_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {fir.crime_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {fir.incident_date}{" "}
                        <span className="text-slate-400">({fir.incident_hour}:00 hrs)</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{fir.station_name}</td>
                      <td className="py-2.5 px-3 font-mono text-purple-700 font-semibold">
                        {fir.loss_value ? inr(fir.loss_value) : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <FirStatusIndicator status={fir.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFir?.(fir);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          Dossier <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligence Engine Report Modal */}
      {intelReport && (
        <IntelligenceReportModal report={intelReport} onClose={() => setIntelReport(null)} />
      )}

      {/* Audit Log Modal */}
      {isAuditOpen && <AuditTrailModal logs={auditLogs} onClose={() => setIsAuditOpen(false)} />}
    </div>
  );
}

function IntelligenceReportModal({
  report,
  onClose,
}: {
  report: IntelligenceReport;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Backend Cross-District Intelligence Output
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Automated Crime Syndicate &amp; Hotspot Analysis
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 mb-1">Executive Briefing:</p>
          <p>{report.summaryBrief}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Detected Multi-Jurisdictional Crime Syndicates ({report.highRiskSyndicates.length})
          </h4>
          <div className="space-y-3">
            {report.highRiskSyndicates.map((syn, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-sm">{syn.syndicateName}</span>
                  <span className="rounded bg-amber-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                    Est. Loss: {inr(syn.estimatedLoss)}
                  </span>
                </div>
                <p className="text-slate-700">
                  <span className="font-semibold">Modus Operandi:</span> {syn.primaryMo}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Suspect Codes:</span>
                  {syn.suspectCodes.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-white border border-amber-300 px-1.5 py-0.5 font-mono font-bold text-amber-800"
                    >
                      {c}
                    </span>
                  ))}
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">Districts:</span>
                  <span className="text-slate-800 font-semibold">
                    {syn.affectedDistricts.join(", ")}
                  </span>
                </div>
                <div className="rounded-lg bg-white border border-amber-200 p-2 text-[11px] text-amber-900 font-medium">
                  <span className="font-bold">Command Action:</span> {syn.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Spatiotemporal Predicted Threat Hotspots
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.predictedHotspots.map((hs, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{hs.station}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      hs.threatLevel === "Severe"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {hs.threatLevel}
                  </span>
                </div>
                <p className="text-slate-600">
                  Window: <span className="font-semibold text-slate-800">{hs.timeWindow}</span>
                </p>
                <p className="text-slate-600">
                  Crime Focus:{" "}
                  <span className="font-semibold text-blue-700">{hs.primaryCrimeType}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditTrailModal({ logs, onClose }: { logs: AuditLogEntry[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Backend System Audit Log</h3>
              <p className="text-xs text-slate-500">
                Command center system operations and real-time ledger updates
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Operator</th>
                <th className="py-2 px-3">Target ID</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 font-semibold text-blue-700 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">
                    {log.user}
                  </td>
                  <td className="py-2 px-3 font-mono text-purple-700 whitespace-nowrap">
                    {log.targetId}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}

export default CrimeFrequencyDashboard;
