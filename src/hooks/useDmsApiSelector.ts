import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo, useEffect, useState } from 'react';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  // Read various explicit preferences for using the mock API.
  const win = window as any;

  function readUseMockFromPrefs(): boolean {
    const qp = new URLSearchParams(win.location.search || '');
    const qpMock = qp.get('mock');
    const localPref = typeof win.__DMS_MOCK_PREF__ === 'boolean' ? win.__DMS_MOCK_PREF__ : undefined;
    let lsPref: boolean | undefined;
    try {
      const ls = localStorage.getItem('dms:useMock');
      if (typeof ls === 'string') lsPref = ['1', 'true', 'yes'].includes(ls.toLowerCase());
    } catch {
      /* ignore */
    }

  // Only enable mock when explicitly requested via one of these mechanisms.
  const explicitPref = (localPref === true || localPref === false ? localPref : undefined);
  const lsFinal = typeof lsPref === 'boolean' ? lsPref : undefined;
  const urlFlag = typeof qpMock === 'string' && ['1', 'true', 'yes'].includes(qpMock.toLowerCase());
  const globalFlag = win.__USE_DMS_MOCK__ === true;

  if (typeof explicitPref === 'boolean') return explicitPref;
  if (typeof lsFinal === 'boolean') return lsFinal;
  if (globalFlag) return true;
  return Boolean(urlFlag);
  }

  // Reactive state so the app switches immediately when the banner toggles the pref.
  const [useMock, setUseMock] = useState<boolean>(() => readUseMockFromPrefs());

  useEffect(() => {
    const onChange = () => setUseMock(readUseMockFromPrefs());
    window.addEventListener('dms:mock-changed', onChange as EventListener);
    return () => window.removeEventListener('dms:mock-changed', onChange as EventListener);
  }, []);

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

