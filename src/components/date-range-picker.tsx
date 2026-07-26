import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, Clock, RotateCcw, Check } from "lucide-react";

export interface DateRangeSelection {
  preset: string; // "All Time" | "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "Last 1 Year" | "Custom Range"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRangeSelection;
  onChange: (value: DateRangeSelection) => void;
  className?: string;
}

export const PRESET_OPTIONS = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 1 Year", days: 365 },
  { label: "All Time", days: 3650 },
  { label: "Custom Range", days: 0 },
];

export function getPresetDates(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<DateRangeSelection>(value);

  const handleSelectPreset = (presetLabel: string, days: number) => {
    if (presetLabel === "Custom Range") {
      setTempSelection((prev) => ({ ...prev, preset: "Custom Range" }));
      return;
    }

    const dates = getPresetDates(days);
    const newSel: DateRangeSelection = {
      preset: presetLabel,
      startDate: dates.startDate,
      endDate: dates.endDate,
    };
    setTempSelection(newSel);
    onChange(newSel);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    onChange(tempSelection);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultSel: DateRangeSelection = {
      preset: "Last 30 Days",
      ...getPresetDates(30),
    };
    setTempSelection(defaultSel);
    onChange(defaultSel);
    setIsOpen(false);
  };

  const formatDisplay = () => {
    if (value.preset !== "Custom Range") {
      return value.preset;
    }
    return `${value.startDate} to ${value.endDate}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
        <span>{formatDisplay()}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Filter Time Interval</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_OPTIONS.map((opt) => {
              const active = tempSelection.preset === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelectPreset(opt.label, opt.days)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left ${
                    active
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="h-3 w-3 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs */}
          {tempSelection.preset === "Custom Range" && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Select Specific Date Range
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempSelection.startDate}
                    onChange={(e) =>
                      setTempSelection((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempSelection.endDate}
                    onChange={(e) =>
                      setTempSelection((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                Apply Custom Date Range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
