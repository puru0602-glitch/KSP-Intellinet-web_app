import React from "react";
import { Printer } from "lucide-react";

interface PrintReportButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  label?: string;
}

export function PrintReportButton({
  className = "",
  variant = "outline",
  label = "Print Report",
}: PrintReportButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-2xs font-semibold",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 shadow-2xs font-medium border border-slate-700",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium shadow-2xs",
  }[variant];

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`no-print flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors focus:outline-none ${variantStyles} ${className}`}
      title="Print official dashboard report or save as PDF (Ctrl+P)"
    >
      <Printer className="h-3.5 w-3.5 text-slate-600" />
      <span>{label}</span>
    </button>
  );
}
