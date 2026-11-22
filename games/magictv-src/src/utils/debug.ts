/**
 * Debug handles (`__magicTV`, `__magicPerf`, `__magicEvents`) are only exposed in
 * development builds, or in a production build opened with `?debug` in the URL
 * (handy for measuring frame rate on the real TV computer).
 */
export const DEBUG: boolean =
  import.meta.env.DEV || (typeof location !== 'undefined' && /[?&]debug\b/.test(location.search));
