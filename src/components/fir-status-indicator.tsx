import React from "react";
import {
  Clock,
  Search,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export type FirStatusType =
  | "Pending"
  | "Under Investigation"
  | "Chargesheeted"
  | "Closed"
  | "Resolved"
  | "Convicted"
  | "Untraced"
  | "Unresolved"
  | string;

interface FirStatusIndicatorProps {
  status: FirStatusType;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function FirStatusIndicator({
  status,
  className = "",
  showIcon = true,
  size = "md",
}: FirStatusIndicatorProps) {
  const normStatus = (status || "").toLowerCase().trim();

  let badgeStyle = "bg-slate-100 text-slate-800 border-slate-300";
  let dotStyle = "bg-slate-400";
  let IconComponent = Clock;

  if (
    normStatus.includes("investigat") ||
    normStatus.includes("active") ||
    normStatus.includes("detected")
  ) {
    badgeStyle = "bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/80";
    dotStyle = "bg-blue-500 animate-pulse";
    IconComponent = Search;
  } else if (
    normStatus.includes("charge") ||
    normStatus.includes("trial") ||
    normStatus.includes("docket")
  ) {
    badgeStyle = "bg-purple-50 text-purple-800 border-purple-200/80 hover:bg-purple-100/80";
    dotStyle = "bg-purple-500";
    IconComponent = FileCheck;
  } else if (
    normStatus.includes("closed") ||
    normStatus.includes("resolve") ||
    normStatus.includes("convict")
  ) {
    badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80";
    dotStyle = "bg-emerald-500";
    IconComponent = CheckCircle2;
  } else if (
    normStatus.includes("untrace") ||
    normStatus.includes("unresolve") ||
    normStatus.includes("cancel")
  ) {
    badgeStyle = "bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100/80";
    dotStyle = "bg-rose-500";
    IconComponent = AlertCircle;
  } else if (
    normStatus.includes("pending") ||
    normStatus.includes("register") ||
    normStatus.includes("open")
  ) {
    badgeStyle = "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80";
    dotStyle = "bg-amber-500 animate-pulse";
    IconComponent = Clock;
  } else if (normStatus.includes("critical") || normStatus.includes("high")) {
    badgeStyle = "bg-red-50 text-red-800 border-red-200/80 hover:bg-red-100/80";
    dotStyle = "bg-red-500 animate-ping";
    IconComponent = ShieldAlert;
  }

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border transition-colors shadow-2xs ${badgeStyle} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle} shrink-0`} />
      {showIcon && <IconComponent className={`${iconSizes} shrink-0 opacity-80`} />}
      <span className="capitalize whitespace-nowrap">{status}</span>
    </span>
  );
}
