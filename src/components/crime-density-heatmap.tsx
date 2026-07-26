import React, { useEffect, useState, ComponentType } from "react";
import type { Fir } from "@/hooks/use-ksp-data";

interface CrimeDensityHeatmapProps {
  firs: Fir[];
  district: string;
  className?: string;
}

export function CrimeDensityHeatmap(props: CrimeDensityHeatmapProps) {
  const [HeatmapComponent, setHeatmapComponent] = useState<ComponentType<CrimeDensityHeatmapProps> | null>(null);

  useEffect(() => {
    import("./crime-density-heatmap-inner").then((mod) => {
      setHeatmapComponent(() => mod.default);
    });
  }, []);

  if (!HeatmapComponent) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 ${props.className || ""}`}>
        <div className="h-[380px] w-full rounded-lg border border-slate-200 bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">
          Initializing Geospatial Map Canvas...
        </div>
      </div>
    );
  }

  return <HeatmapComponent {...props} />;
}
