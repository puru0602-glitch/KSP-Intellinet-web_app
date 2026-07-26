import React from "react";
import { inr } from "@/lib/ksp-analytics";
import { TrendingUp, ShieldAlert, Clock, Percent } from "lucide-react";

export interface CustomChartTooltipPayload {
  name?: string;
  count?: number;
  value?: number;
  totalLoss?: number;
  percentage?: number;
  sharePercent?: string;
  detectionRate?: number;
  nightPercentage?: number;
  color?: string;
  fill?: string;
  topStation?: string;
  date?: string;
  observed?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
  [key: string]: unknown;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CustomChartTooltipPayload;
    color?: string;
    name?: string;
    value?: number;
  }>;
  label?: string;
  title?: string;
}

export function CustomChartTooltip({ active, payload, label, title }: CustomChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload || {};
  const itemName = data.name || label || title || "Metrics";
  const itemColor = data.color || data.fill || payload[0].color || "#3b82f6";

  return (
    <div className="animate-in fade-in zoom-in-95 duration-150 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2 min-w-[210px] z-50">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 truncate">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: itemColor }}
          />
          <span className="truncate">{itemName}</span>
        </div>
        {data.detectionRate !== undefined && (
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {data.detectionRate}% Solved
          </span>
        )}
      </div>

      <div className="space-y-1 text-slate-700">
        {data.count !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-blue-500" />
              FIR Reports:
            </span>
            <span className="font-bold text-blue-700 font-mono text-xs">{data.count} cases</span>
          </div>
        )}

        {data.observed !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Observed Volume:</span>
            <span className="font-bold text-blue-700 font-mono text-xs">{data.observed} FIRs</span>
          </div>
        )}

        {data.forecast !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              AI Forecast:
            </span>
            <span className="font-bold text-purple-700 font-mono text-xs">
              {data.forecast} FIRs
            </span>
          </div>
        )}

        {data.percentage !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <Percent className="h-3 w-3 text-slate-400" />
              Jurisdiction Share:
            </span>
            <span className="font-semibold text-slate-800 font-mono">{data.percentage}%</span>
          </div>
        )}

        {data.totalLoss !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Property Loss:</span>
            <span className="font-semibold text-purple-700 font-mono">{inr(data.totalLoss)}</span>
          </div>
        )}

        {data.nightPercentage !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-rose-500" />
              Night Window Rate:
            </span>
            <span className="font-semibold text-rose-700 font-mono">{data.nightPercentage}%</span>
          </div>
        )}

        {data.topStation && (
          <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            Primary Hotspot: <span className="font-semibold text-slate-800">{data.topStation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
