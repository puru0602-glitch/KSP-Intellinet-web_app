import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to live FIR / hotspot changes and refreshes every dashboard query
 * so counters, charts and the map stay current inside the active filter window.
 */
export function useKspRealtime() {
  const queryClient = useQueryClient();
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("ksp-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "firs" }, () => {
          setLastEventAt(new Date());
          queryClient.invalidateQueries({ queryKey: ["firs"] });
          queryClient.invalidateQueries({ queryKey: ["suspect_firs"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "crime_hotspots" }, () => {
          setLastEventAt(new Date());
          queryClient.invalidateQueries({ queryKey: ["crime_hotspots"] });
        })
        .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    } catch (e) {
      console.warn("[Realtime] Subscription error:", e);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [queryClient]);

  return { connected, lastEventAt };
}
