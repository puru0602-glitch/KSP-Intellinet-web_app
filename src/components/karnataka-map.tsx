import { useEffect, useState, ComponentType } from "react";
import type { Fir, Hotspot, PoliceStation } from "@/hooks/use-ksp-data";

export type MapLayers = {
  heat: boolean;
  stations: boolean;
  incidents: boolean;
  cluster: boolean;
};

interface KarnatakaMapProps {
  hotspots: Hotspot[];
  stations: PoliceStation[];
  firs: Fir[];
  hour: number;
  layers: MapLayers;
  intensity: number;
  onSelectFir: (f: Fir) => void;
  onSelectStation: (s: PoliceStation) => void;
}

export default function KarnatakaMap(props: KarnatakaMapProps) {
  const [MapComponent, setMapComponent] = useState<ComponentType<KarnatakaMapProps> | null>(null);

  useEffect(() => {
    import("./karnataka-map-inner").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="h-full w-full bg-slate-950 flex items-center justify-center text-slate-500 text-xs font-medium">
        Loading Geospatial Map Canvas...
      </div>
    );
  }

  return <MapComponent {...props} />;
}
