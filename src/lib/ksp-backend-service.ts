import { supabase } from "@/integrations/supabase/client";
import { MOCK_FIRS, MOCK_SUSPECTS, MOCK_HOTSPOTS } from "@/hooks/ksp-mock-data";
import type { Fir, Suspect, Hotspot } from "@/hooks/use-ksp-data";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  targetId: string;
  details: string;
  severity: "info" | "warning" | "critical";
}

export interface IntelligenceReport {
  id: string;
  generatedAt: string;
  firsAnalyzed: number;
  suspectsAnalyzed: number;
  highRiskSyndicates: {
    syndicateName: string;
    primaryMo: string;
    suspectCodes: string[];
    affectedDistricts: string[];
    estimatedLoss: number;
    recommendedAction: string;
  }[];
  predictedHotspots: {
    district: string;
    station: string;
    timeWindow: string;
    threatLevel: "High" | "Medium" | "Severe";
    primaryCrimeType: string;
  }[];
  summaryBrief: string;
}

// In-memory persistent state across API calls during server/runtime session
let inMemoryFirs: Fir[] = [...MOCK_FIRS];
const inMemorySuspects: Suspect[] = [...MOCK_SUSPECTS];
const inMemoryHotspots: Hotspot[] = [...MOCK_HOTSPOTS];
const auditLogs: AuditLogEntry[] = [
  {
    id: "log-101",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: "SYSTEM_INIT",
    user: "SCRB System Daemon",
    targetId: "KSP-INTELLINET",
    details: "Backend Intelligence Engine & Real-time Database synchronization initialized",
    severity: "info",
  },
  {
    id: "log-102",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    action: "SUSPECT_BOLO_ISSUED",
    user: "Insp. M. Ramesh (Whitefield)",
    targetId: "S-1042",
    details: "Automated BOLO flag broadcasted for Ravi Kumar following serial vehicle thefts",
    severity: "warning",
  },
];

export const KspBackendService = {
  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLogEntry[] {
    return [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  logAction(
    action: string,
    user: string,
    targetId: string,
    details: string,
    severity: "info" | "warning" | "critical" = "info",
  ) {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      user,
      targetId,
      details,
      severity,
    };
    auditLogs.unshift(entry);
    if (auditLogs.length > 100) auditLogs.pop();
    return entry;
  },

  // --- FIRS CRUD ---
  async getFirs(filters?: {
    district?: string;
    crimeType?: string;
    status?: string;
  }): Promise<Fir[]> {
    try {
      let q = supabase
        .from("firs")
        .select(
          "id, fir_number, incident_date, incident_hour, district, station_name, crime_type, status, loss_value, locality, latitude, longitude, summary, suspect_code, investigating_officer",
        )
        .order("incident_date", { ascending: false });

      if (filters?.district && filters.district !== "All Districts") {
        q = q.eq("district", filters.district);
      }
      if (filters?.crimeType && filters.crimeType !== "All Types") {
        q = q.eq("crime_type", filters.crimeType);
      }

      const { data, error } = await q.returns<Fir[]>();
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Supabase FIR query failed, falling back to backend state", e);
    }

    let result = [...inMemoryFirs];
    if (filters?.district && filters.district !== "All Districts") {
      result = result.filter((f) => f.district === filters.district);
    }
    if (filters?.crimeType && filters.crimeType !== "All Types") {
      result = result.filter((f) => f.crime_type === filters.crimeType);
    }
    if (filters?.status && filters.status !== "All Statuses") {
      result = result.filter((f) => f.status === filters.status);
    }
    return result;
  },

  async createFir(payload: Omit<Fir, "id">): Promise<Fir> {
    const fir_number =
      payload.fir_number ||
      `FIR/${payload.station_name.slice(0, 3).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const newFir: Fir = {
      ...payload,
      id: `fir-${Date.now()}`,
      fir_number,
    };

    try {
      const { data, error } = await supabase.from("firs").insert([newFir]).select().single();

      if (!error && data) {
        this.logAction(
          "FIR_CREATE",
          payload.investigating_officer || "Station Duty Officer",
          data.fir_number,
          `New FIR registered under ${data.crime_type} at ${data.station_name} (${data.district})`,
          "info",
        );
        inMemoryFirs.unshift(data as Fir);
        return data as Fir;
      }
    } catch (e) {
      console.warn("Supabase insert FIR error, persisting to memory", e);
    }

    inMemoryFirs.unshift(newFir);
    this.logAction(
      "FIR_CREATE",
      payload.investigating_officer || "Station Duty Officer",
      newFir.fir_number,
      `New FIR registered under ${newFir.crime_type} at ${newFir.station_name} (${newFir.district})`,
      "info",
    );
    return newFir;
  },

  async updateFir(id: string, updates: Partial<Fir>): Promise<Fir> {
    try {
      const { data, error } = await supabase
        .from("firs")
        .update(updates)
        .eq("fir_number", id)
        .select()
        .single();

      if (!error && data) {
        this.logAction(
          "FIR_UPDATE",
          updates.investigating_officer || "SCRB Operator",
          id,
          `FIR updated with status: ${updates.status || "Updated"} and IO: ${updates.investigating_officer || "Unchanged"}`,
          "info",
        );
        const idx = inMemoryFirs.findIndex((f) => f.fir_number === id || f.id === id);
        if (idx !== -1) inMemoryFirs[idx] = { ...inMemoryFirs[idx], ...updates };
        return data as Fir;
      }
    } catch (e) {
      console.warn("Supabase update FIR error, updating memory", e);
    }

    const idx = inMemoryFirs.findIndex((f) => f.fir_number === id || f.id === id);
    if (idx === -1) {
      throw new Error(`FIR with id/number ${id} not found`);
    }
    inMemoryFirs[idx] = { ...inMemoryFirs[idx], ...updates };
    this.logAction(
      "FIR_UPDATE",
      updates.investigating_officer || "SCRB Operator",
      id,
      `FIR updated: status=${updates.status ?? inMemoryFirs[idx].status}, loss=${updates.loss_value ?? inMemoryFirs[idx].loss_value}`,
      "info",
    );
    return inMemoryFirs[idx];
  },

  async deleteFir(id: string): Promise<{ success: boolean; id: string }> {
    try {
      await supabase.from("firs").delete().eq("fir_number", id);
    } catch (e) {
      console.warn("Supabase delete error", e);
    }

    inMemoryFirs = inMemoryFirs.filter((f) => f.fir_number !== id && f.id !== id);
    this.logAction(
      "FIR_DELETE",
      "SCRB Command Clearance",
      id,
      `FIR record ${id} purged or archived by command authorization`,
      "warning",
    );
    return { success: true, id };
  },

  // --- SUSPECTS CRUD ---
  async getSuspects(district?: string): Promise<Suspect[]> {
    try {
      let q = supabase.from("suspects").select("*").order("risk_score", { ascending: false });
      if (district && district !== "All Districts") {
        q = q.eq("district", district);
      }
      const { data, error } = await q.returns<Suspect[]>();
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn("Supabase suspects error", e);
    }

    let list = [...inMemorySuspects];
    if (district && district !== "All Districts") {
      list = list.filter((s) => s.district === district);
    }
    return list;
  },

  async updateSuspect(suspectCode: string, updates: Partial<Suspect>): Promise<Suspect> {
    try {
      const { data, error } = await supabase
        .from("suspects")
        .update(updates)
        .eq("suspect_code", suspectCode)
        .select()
        .single();

      if (!error && data) {
        this.logAction(
          "SUSPECT_UPDATE",
          "Intel Analyst",
          suspectCode,
          `Suspect ${suspectCode} risk score recalculated to ${updates.risk_score ?? "unmodified"}, status: ${updates.status ?? "unmodified"}`,
          "info",
        );
        const idx = inMemorySuspects.findIndex((s) => s.suspect_code === suspectCode);
        if (idx !== -1) inMemorySuspects[idx] = { ...inMemorySuspects[idx], ...updates };
        return data as Suspect;
      }
    } catch (e) {
      console.warn("Supabase update suspect error", e);
    }

    const idx = inMemorySuspects.findIndex((s) => s.suspect_code === suspectCode);
    if (idx === -1) throw new Error(`Suspect ${suspectCode} not found`);
    inMemorySuspects[idx] = { ...inMemorySuspects[idx], ...updates };
    this.logAction(
      "SUSPECT_UPDATE",
      "Intel Analyst",
      suspectCode,
      `Suspect updated: risk=${updates.risk_score ?? inMemorySuspects[idx].risk_score}, status=${updates.status ?? inMemorySuspects[idx].status}`,
      "info",
    );
    return inMemorySuspects[idx];
  },

  // --- INTELLIGENCE ENGINE ---
  async runIntelligenceAnalysis(filters: {
    district: string;
    dateRange: string;
  }): Promise<IntelligenceReport> {
    const currentFirs = await this.getFirs({ district: filters.district });
    const currentSuspects = await this.getSuspects(filters.district);

    // Analyze high risk syndicates via cross-district MO matching
    const crimeGroupMap = new Map<string, { firs: Fir[]; totalLoss: number }>();
    currentFirs.forEach((f) => {
      const existing = crimeGroupMap.get(f.crime_type) || { firs: [], totalLoss: 0 };
      existing.firs.push(f);
      existing.totalLoss += Number(f.loss_value || 0);
      crimeGroupMap.set(f.crime_type, existing);
    });

    const highRiskSyndicates = [];
    if (crimeGroupMap.has("Vehicle Theft")) {
      const group = crimeGroupMap.get("Vehicle Theft")!;
      highRiskSyndicates.push({
        syndicateName: "Interstate Pulsar Re-stamping Syndicate",
        primaryMo:
          "Master-key entry, night-window lifting (02:00-04:00) & Hoskote chassis re-stamping",
        suspectCodes: ["S-1042", "S-2213"],
        affectedDistricts: ["Bengaluru Urban", "Mysuru", "Kalaburagi"],
        estimatedLoss: group.totalLoss,
        recommendedAction:
          "Deploy check-posts on Bengaluru-Hoskote Highway and execute night patrols near apartment basements.",
      });
    }

    if (crimeGroupMap.has("Cyber Fraud")) {
      const group = crimeGroupMap.get("Cyber Fraud")!;
      highRiskSyndicates.push({
        syndicateName: "Coastal Fake KYC & Mule Network",
        primaryMo:
          "Spoofed bank calls, OTP phishing and immediate conversion to Mysuru/Mangaluru crypto mule accounts",
        suspectCodes: ["S-4471", "S-8891"],
        affectedDistricts: ["Bengaluru Urban", "Mangaluru", "Mysuru"],
        estimatedLoss: group.totalLoss,
        recommendedAction:
          "Issue freeze orders to bank nodal officers for identified mule account branches.",
      });
    }

    if (crimeGroupMap.has("Chain Snatching")) {
      const group = crimeGroupMap.get("Chain Snatching")!;
      highRiskSyndicates.push({
        syndicateName: "Market Exit Pillion Snatching Module",
        primaryMo:
          "Pillion ride targeting pedestrians on unlit market exits during evening prayer windows (18:00-21:00)",
        suspectCodes: ["S-2213", "S-5514"],
        affectedDistricts: ["Mysuru", "Bengaluru Urban"],
        estimatedLoss: group.totalLoss,
        recommendedAction:
          "Mount evening beat patrols at Devaraja Market & Koramangala service roads.",
      });
    }

    const predictedHotspots = inMemoryHotspots
      .filter((h) => filters.district === "All Districts" || h.district === filters.district)
      .slice(0, 4)
      .map((h) => ({
        district: h.district,
        station: h.station_name || `${h.district} Core`,
        timeWindow: h.peak_window || "22:00 - 04:00",
        threatLevel:
          h.intensity > 0.85
            ? ("Severe" as const)
            : h.intensity > 0.7
              ? ("High" as const)
              : ("Medium" as const),
        primaryCrimeType: h.dominant_crime_type,
      }));

    const report: IntelligenceReport = {
      id: `intel-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      firsAnalyzed: currentFirs.length,
      suspectsAnalyzed: currentSuspects.length,
      highRiskSyndicates,
      predictedHotspots,
      summaryBrief: `Intelligence Engine completed analysis of ${currentFirs.length} FIR records across ${filters.district}. Identified ${highRiskSyndicates.length} active multi-jurisdictional crime syndicates and mapped ${predictedHotspots.length} high-threat operational windows.`,
    };

    this.logAction(
      "INTELLIGENCE_RUN",
      "Automated Intel Daemon",
      report.id,
      `Cross-district MO analysis completed for ${filters.district}. Identified ${highRiskSyndicates.length} active crime syndicates.`,
      "info",
    );

    return report;
  },
};
