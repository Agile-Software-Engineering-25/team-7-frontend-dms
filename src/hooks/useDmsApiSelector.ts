import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo } from 'react';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  /**
   * Selector that returns either the real API hook or the mock API.
   * Precedence for enabling mock mode (highest -> lowest):
   * 1. explicit runtime window flag `window.__DMS_MOCK_PREF__` (set by banner)
   * 2. `localStorage['dms:useMock']` (persisted banner toggle)
   * 3. query param `?mock=1`
   * 4. `window.__USE_DMS_MOCK__` global
   * 5. auto-enable in dev builds (import.meta.env.DEV)
   */
  // Toggle mock mode via:
  // - window.__USE_DMS_MOCK__ = true (set before app boot)
  // - or append ?mock=1 to the URL
  const win = window as any;
  const qp = new URLSearchParams(window.location.search || '');
  const qpMock = qp.get('mock');
  // Auto-enable in dev builds (import.meta.env.DEV true for Vite)
  const devAuto = Boolean((import.meta as any).env?.DEV === true || process.env.NODE_ENV === 'development');
  // localStorage override (dev toggle)
  const localPref = typeof win.__DMS_MOCK_PREF__ === 'boolean' ? win.__DMS_MOCK_PREF__ : undefined;
  const ls = (() => {
    try {
      return localStorage.getItem('dms:useMock');
    } catch {
      return null;
    }
  })();
  const lsPref = typeof ls === 'string' ? ['1', 'true', 'yes'].includes(ls.toLowerCase()) : undefined;
  const useMock = (
    (localPref === true || localPref === false ? localPref : undefined) ??
    (typeof lsPref === 'boolean' ? lsPref : undefined) ??
    undefined
  ) ||
    win.__USE_DMS_MOCK__ === true ||
    (typeof qpMock === 'string' && ['1', 'true', 'yes'].includes(qpMock.toLowerCase())) ||
    devAuto;

  if (useMock) {
    if (!mockInstance) mockInstance = createMockApi();
    // small log so it's obvious in devtools
    // eslint-disable-next-line no-console
    console.info('DMS: using mock API');
    return mockInstance;
  }

  const real = useDmsApi();
  // ensure a stable reference across renders
  return useMemo(() => real, [real]);
}
