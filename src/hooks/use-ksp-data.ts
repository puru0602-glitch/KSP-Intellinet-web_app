import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MOCK_FIRS,
  MOCK_SUSPECTS,
  MOCK_POLICE_STATIONS,
  MOCK_HOTSPOTS,
  MOCK_NETWORK_NODES,
} from "./ksp-mock-data";

export type Fir = {
  id: string;
  fir_number: string;
  incident_date: string;
  incident_hour: number;
  district: string;
  station_name: string;
  crime_type: string;
  status: string;
  loss_value: number;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  summary: string | null;
  suspect_code: string | null;
  investigating_officer: string | null;
};

export type Suspect = {
  id: string;
  suspect_code: string;
  name: string;
  aliases: string[];
  district: string;
  station_name: string;
  phone_numbers: string[];
  vehicle: string | null;
  mo_description: string;
  mo_tags: string[];
  risk_score: number;
  cross_jurisdiction: string[];
  status: string;
};

export type PoliceStation = {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  jurisdiction: string | null;
};

export type Hotspot = {
  id: string;
  name: string;
  district: string;
  station_name: string | null;
  latitude: number;
  longitude: number;
  intensity: number;
  dominant_crime_type: string;
  incident_count: number;
  peak_window: string | null;
};

export type NetworkNode = {
  id: string;
  node_id: string;
  label: string;
  node_type: string;
  district: string | null;
  pos_x: number;
  pos_y: number;
  linked_nodes: string[];
  suspect_code: string | null;
};

export type KspFilters = {
  district: string;
  crimeType: string;
  dateRange: string;
};

export const DATE_RANGE_DAYS: Record<string, number> = {
  "Last 24 hours": 1,
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
};

function cutoffISO(dateRange: string): string {
  const days = DATE_RANGE_DAYS[dateRange] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function filterMockFirs(filters: KspFilters): Fir[] {
  const cutoff = cutoffISO(filters.dateRange);
  return MOCK_FIRS.filter((f) => {
    if (f.incident_date < cutoff) return false;
    if (filters.district !== "All Districts" && f.district !== filters.district) return false;
    if (filters.crimeType !== "All Types" && f.crime_type !== filters.crimeType) return false;
    return true;
  });
}

/** FIRs scoped to the active global filters, straight from the database (with fallback). */
export function useFirs(filters: KspFilters) {
  return useQuery({
    queryKey: ["firs", filters.district, filters.crimeType, filters.dateRange],
    queryFn: async (): Promise<Fir[]> => {
      try {
        let q = supabase
          .from("firs")
          .select(
            "id, fir_number, incident_date, incident_hour, district, station_name, crime_type, status, loss_value, locality, latitude, longitude, summary, suspect_code, investigating_officer",
          )
          .gte("incident_date", cutoffISO(filters.dateRange))
          .order("incident_date", { ascending: false });

        if (filters.district !== "All Districts") q = q.eq("district", filters.district);
        if (filters.crimeType !== "All Types") q = q.eq("crime_type", filters.crimeType);

        const { data, error } = await q.returns<Fir[]>();
        if (error || !data || data.length === 0) {
          return filterMockFirs(filters);
        }
        return data;
      } catch {
        return filterMockFirs(filters);
      }
    },
  });
}

export function useSuspects(district = "All Districts") {
  return useQuery({
    queryKey: ["suspects", district],
    queryFn: async (): Promise<Suspect[]> => {
      try {
        let q = supabase.from("suspects").select("*").order("risk_score", { ascending: false });
        if (district !== "All Districts") q = q.eq("district", district);
        const { data, error } = await q.returns<Suspect[]>();
        if (error || !data || data.length === 0) {
          return district === "All Districts"
            ? MOCK_SUSPECTS
            : MOCK_SUSPECTS.filter((s) => s.district === district);
        }
        return data;
      } catch {
        return district === "All Districts"
          ? MOCK_SUSPECTS
          : MOCK_SUSPECTS.filter((s) => s.district === district);
      }
    },
  });
}

export function usePoliceStations(district = "All Districts") {
  return useQuery({
    queryKey: ["police_stations", district],
    queryFn: async (): Promise<PoliceStation[]> => {
      try {
        let q = supabase.from("police_stations").select("*").order("district");
        if (district !== "All Districts") q = q.eq("district", district);
        const { data, error } = await q.returns<PoliceStation[]>();
        if (error || !data || data.length === 0) {
          return district === "All Districts"
            ? MOCK_POLICE_STATIONS
            : MOCK_POLICE_STATIONS.filter((ps) => ps.district === district);
        }
        return data;
      } catch {
        return district === "All Districts"
          ? MOCK_POLICE_STATIONS
          : MOCK_POLICE_STATIONS.filter((ps) => ps.district === district);
      }
    },
  });
}

export function useHotspots(filters: Pick<KspFilters, "district" | "crimeType">) {
  return useQuery({
    queryKey: ["crime_hotspots", filters.district, filters.crimeType],
    queryFn: async (): Promise<Hotspot[]> => {
      try {
        let q = supabase
          .from("crime_hotspots")
          .select("*")
          .order("intensity", { ascending: false });
        if (filters.district !== "All Districts") q = q.eq("district", filters.district);
        if (filters.crimeType !== "All Types") q = q.eq("dominant_crime_type", filters.crimeType);
        const { data, error } = await q.returns<Hotspot[]>();
        if (error || !data || data.length === 0) {
          return MOCK_HOTSPOTS.filter((h) => {
            if (filters.district !== "All Districts" && h.district !== filters.district)
              return false;
            if (filters.crimeType !== "All Types" && h.dominant_crime_type !== filters.crimeType)
              return false;
            return true;
          });
        }
        return data;
      } catch {
        return MOCK_HOTSPOTS.filter((h) => {
          if (filters.district !== "All Districts" && h.district !== filters.district) return false;
          if (filters.crimeType !== "All Types" && h.dominant_crime_type !== filters.crimeType)
            return false;
          return true;
        });
      }
    },
  });
}

export function useNetworkNodes(district = "All Districts") {
  return useQuery({
    queryKey: ["network_nodes", district],
    queryFn: async (): Promise<NetworkNode[]> => {
      try {
        const { data, error } = await supabase
          .from("network_nodes")
          .select("*")
          .returns<NetworkNode[]>();
        if (error || !data || data.length === 0) {
          const all = MOCK_NETWORK_NODES;
          if (district === "All Districts") return all;
          const keep = new Set(all.filter((n) => n.district === district).map((n) => n.node_id));
          return all.filter((n) => keep.has(n.node_id) || n.linked_nodes.some((l) => keep.has(l)));
        }
        const all = data;
        if (district === "All Districts") return all;
        const keep = new Set(all.filter((n) => n.district === district).map((n) => n.node_id));
        return all.filter((n) => keep.has(n.node_id) || n.linked_nodes.some((l) => keep.has(l)));
      } catch {
        const all = MOCK_NETWORK_NODES;
        if (district === "All Districts") return all;
        const keep = new Set(all.filter((n) => n.district === district).map((n) => n.node_id));
        return all.filter((n) => keep.has(n.node_id) || n.linked_nodes.some((l) => keep.has(l)));
      }
    },
  });
}

/** All FIRs linked to a suspect code (used by the MO drawer). */
export function useSuspectFirs(suspectCode: string | null) {
  return useQuery({
    enabled: !!suspectCode,
    queryKey: ["suspect_firs", suspectCode],
    queryFn: async (): Promise<Fir[]> => {
      try {
        const { data, error } = await supabase
          .from("firs")
          .select("*")
          .eq("suspect_code", suspectCode!)
          .order("incident_date", { ascending: false })
          .returns<Fir[]>();
        if (error || !data || data.length === 0) {
          return MOCK_FIRS.filter((f) => f.suspect_code === suspectCode);
        }
        return data;
      } catch {
        return MOCK_FIRS.filter((f) => f.suspect_code === suspectCode);
      }
    },
  });
}
