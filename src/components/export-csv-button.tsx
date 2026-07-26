import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import type { Fir } from "@/hooks/use-ksp-data";

interface ExportCsvButtonProps {
  district: string;
  dateRange: string;
  firs: Fir[];
  crimeTypeStats: Array<{
    name: string;
    count: number;
    percentage?: number;
    sharePercent?: string;
    totalLoss: number;
    detectionRate: number;
    topStation: string;
  }>;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

export function ExportCsvButton({
  district,
  dateRange,
  firs,
  crimeTypeStats,
  className = "",
  variant = "primary",
}: ExportCsvButtonProps) {
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const totalFirs = firs.length;
    const totalFinancialLoss = firs.reduce((acc, f) => acc + (f.loss_value || 0), 0);

    const csvLines: string[] = [];

    // Header & Executive Summary
    csvLines.push(`"KARNATAKA STATE POLICE - CRIME FREQUENCY & DASHBOARD REPORT"`);
    csvLines.push(`"Generated On","${new Date().toLocaleString()}"`);
    csvLines.push(`"Jurisdiction District","${district}"`);
    csvLines.push(`"Filtered Time Interval","${dateRange}"`);
    csvLines.push(`"Total FIR Records","${totalFirs}"`);
    csvLines.push(`"Total Financial Property Loss (INR)","${totalFinancialLoss}"`);
    csvLines.push(``);

    // Section 1: Crime Typology Statistics
    csvLines.push(`"CRIME TYPOLOGY FREQUENCY & LOSS BREAKDOWN"`);
    csvLines.push(
      `"Crime Category","FIR Count","Share (%)","Total Loss (INR)","Detection Rate (%)","Top Hotspot Station"`,
    );
    crimeTypeStats.forEach((stat) => {
      const share = stat.percentage !== undefined ? stat.percentage : (stat.sharePercent ?? 0);
      csvLines.push(
        `"${stat.name}","${stat.count}","${share}%","${stat.totalLoss}","${stat.detectionRate}%","${stat.topStation.replace(/"/g, '""')}"`,
      );
    });
    csvLines.push(``);

    // Section 2: Detailed Filtered FIR Dossiers
    csvLines.push(`"FILTERED FIR DOSSIER RECORDS"`);
    csvLines.push(
      `"FIR Number","Incident Date","Incident Hour","District","Police Station","Crime Type","Status","Loss Value (INR)","Locality","Investigating Officer","Summary"`,
    );
    firs.forEach((f) => {
      csvLines.push(
        `"${f.fir_number}","${f.incident_date}","${f.incident_hour}:00","${f.district}","${f.station_name.replace(/"/g, '""')}","${f.crime_type}","${f.status}","${f.loss_value || 0}","${(f.locality || "").replace(/"/g, '""')}","${(f.investigating_officer || "").replace(/"/g, '""')}","${(f.summary || "").replace(/"/g, '""')}"`,
      );
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `KSP_Crime_Statistics_${district.replace(/\s+/g, "_")}_${timestamp}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const variantStyles = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs font-semibold",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 shadow-2xs font-medium border border-slate-700",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium shadow-2xs",
  }[variant];

  return (
    <button
      id="export-csv-btn"
      type="button"
      onClick={handleExportCsv}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors focus:outline-none ${variantStyles} ${className}`}
      title="Export dashboard statistics and filtered FIR records as a CSV file (Ctrl+E)"
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
      <span>Export CSV Stats</span>
      <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-100/80 px-1 py-0.2 text-[9px] font-mono text-slate-500 font-semibold">
        Ctrl+E
      </kbd>
      <Download className="h-3 w-3 opacity-75 ml-0.5" />
    </button>
  );
}
