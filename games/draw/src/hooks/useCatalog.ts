import { useCallback, useEffect, useRef, useState } from "react";
import { CATALOG_SYNC_INTERVAL_MS } from "../config";
import { catalogFingerprint, loadCatalog, readCachedCatalog, resolveCatalog } from "../services/catalog";
import type { ColoringCatalog, ResolvedCategory } from "../types";

export type SyncStatus = "loading" | "online" | "offline" | "error";

interface UseCatalogResult {
  categories: ResolvedCategory[];
  status: SyncStatus;
  lastUpdated: string;
  lastSyncedAt: number | null;
  refresh: () => Promise<void>;
}

export function useCatalog(): UseCatalogResult {
  const [catalog, setCatalog] = useState<ColoringCatalog | null>(null);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const syncingRef = useRef(false);
  const mountedRef = useRef(true);
  const fingerprintRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (mountedRef.current && navigator.onLine) setStatus((current) => (current === "loading" ? current : "online"));
    try {
      const result = await loadCatalog();
      if (!mountedRef.current) return;
      const fingerprint = catalogFingerprint(result.catalog);
      if (fingerprint !== fingerprintRef.current) {
        fingerprintRef.current = fingerprint;
        setCatalog(result.catalog);
      }
      setLastSyncedAt(Date.now());
      setStatus(result.source === "network" ? "online" : "offline");
    } catch {
      if (mountedRef.current) setStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      const cached = await readCachedCatalog();
      if (cached && mountedRef.current) {
        fingerprintRef.current = catalogFingerprint(cached);
        setCatalog(cached);
      }
      await refresh();
    })();

    const interval = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") void refresh();
    }, CATALOG_SYNC_INTERVAL_MS);

    const handleOnline = () => void refresh();
    const handleOffline = () => {
      if (mountedRef.current) setStatus("offline");
    };
    const handleVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [refresh]);

  const categories = catalog ? resolveCatalog(catalog) : [];

  return {
    categories,
    status,
    lastUpdated: catalog?.lastUpdated ?? "",
    lastSyncedAt,
    refresh,
  };
}