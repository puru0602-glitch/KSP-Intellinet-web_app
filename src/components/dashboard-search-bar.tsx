import React from "react";
import { Search, X, Filter } from "lucide-react";

interface DashboardSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  placeholder?: string;
  className?: string;
  matchCount?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const STATUS_FILTER_OPTIONS = [
  "All Statuses",
  "Under Investigation",
  "Chargesheeted",
  "Resolved",
  "Pending",
];

export function DashboardSearchBar({
  searchQuery,
  onSearchChange,
  statusFilter = "All Statuses",
  onStatusFilterChange,
  placeholder = "Search by FIR ID, complainant, officer, date (YYYY-MM-DD), station...",
  className = "",
  matchCount,
  inputRef,
}: DashboardSearchBarProps) {
  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-2 ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 shadow-2xs"
            title="Press '/' to search"
          >
            /
          </kbd>
        )}
      </div>

      {/* Optional Status Filter Dropdown */}
      {onStatusFilterChange && (
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 hover:border-slate-300 shrink-0">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-transparent font-medium outline-none cursor-pointer text-slate-800"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-white text-slate-900">
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Match Count Badge */}
      {matchCount !== undefined && (
        <span className="text-[11px] font-mono font-semibold text-slate-500 shrink-0">
          {matchCount} records
        </span>
      )}
    </div>
  );
}
