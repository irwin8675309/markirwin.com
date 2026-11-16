/**
 * All runtime locations are derived from the document URL and Vite's relative
 * base. There are intentionally no repository, domain, or absolute path values.
 */
const relativeBase = new URL("./", document.baseURI);

export const APP_BASE_URL = relativeBase;
export const CATALOG_URL = new URL("coloring-library/catalog.json", relativeBase).href;
export const SERVICE_WORKER_URL = new URL("service-worker.js", relativeBase).href;
export const SERVICE_WORKER_SCOPE = relativeBase.href;

export const MAX_WORKING_DIMENSION = 1500;
export const MAX_HISTORY_STEPS = 12;
export const CATALOG_SYNC_INTERVAL_MS = 60_000;