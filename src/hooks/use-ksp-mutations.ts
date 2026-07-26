import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KspBackendService,
  type AuditLogEntry,
  type IntelligenceReport,
} from "@/lib/ksp-backend-service";
import type { Fir, Suspect } from "./use-ksp-data";
import { toast } from "sonner";

/** Hook to fetch backend system operation audit logs */
export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => KspBackendService.getAuditLogs(),
    refetchInterval: 5000,
  });
}

/** Hook to register a new FIR record in the backend */
export function useCreateFir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<Fir, "id">) => KspBackendService.createFir(payload),
    onSuccess: (newFir) => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success(`FIR ${newFir.fir_number} registered successfully`, {
        description: `${newFir.crime_type} at ${newFir.station_name} logged into Command Center database.`,
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to register FIR", { description: err.message });
    },
  });
}

/** Hook to update an existing FIR record's status, IO, loss value or summary */
export function useUpdateFir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Fir> }) =>
      KspBackendService.updateFir(id, updates),
    onSuccess: (updatedFir) => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success(`FIR ${updatedFir.fir_number} updated`, {
        description: `Status: ${updatedFir.status} · IO: ${updatedFir.investigating_officer || "Unassigned"}`,
      });
    },
    onError: (err: Error) => {
      toast.error("FIR update failed", { description: err.message });
    },
  });
}

/** Hook to purge or archive an FIR from the backend */
export function useDeleteFir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => KspBackendService.deleteFir(id),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["firs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.info(`FIR ${id} archived from active view`, {
        description: "Operation logged to command audit trail.",
      });
    },
    onError: (err: Error) => {
      toast.error("Archive failed", { description: err.message });
    },
  });
}

/** Hook to update suspect status or risk score */
export function useUpdateSuspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suspectCode, updates }: { suspectCode: string; updates: Partial<Suspect> }) =>
      KspBackendService.updateSuspect(suspectCode, updates),
    onSuccess: (suspect) => {
      queryClient.invalidateQueries({ queryKey: ["suspects"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success(`Suspect ${suspect.suspect_code} updated`, {
        description: `New Risk Score: ${suspect.risk_score}/100 · Status: ${suspect.status}`,
      });
    },
    onError: (err: Error) => {
      toast.error("Suspect update failed", { description: err.message });
    },
  });
}

/** Hook to execute the backend cross-referencing Intelligence Engine */
export function useRunIntelligenceAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filters: { district: string; dateRange: string }) =>
      KspBackendService.runIntelligenceAnalysis(filters),
    onSuccess: (report: IntelligenceReport) => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success("Intelligence Engine Execution Complete", {
        description: `Analyzed ${report.firsAnalyzed} FIRs · Discovered ${report.highRiskSyndicates.length} active crime syndicates.`,
      });
    },
    onError: (err: Error) => {
      toast.error("Intelligence Analysis failed", { description: err.message });
    },
  });
}
