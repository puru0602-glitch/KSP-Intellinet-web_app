ALTER TABLE public.firs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.firs;
ALTER TABLE public.crime_hotspots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crime_hotspots;