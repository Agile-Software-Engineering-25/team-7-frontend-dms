import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo } from 'react';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  const win = window as any;

  function readUseMock(): boolean {
    try {
      // Primary: explicit global set by code before app boot
      if (win.__USE_DMS_MOCK__ === true) return true;
      // Backwards compatible: allow ?mock=1 in URL for quick testing
      const qp = new URLSearchParams(win.location.search || '');
      const qpMock = qp.get('mock');
      if (typeof qpMock === 'string' && ['1', 'true', 'yes'].includes(qpMock.toLowerCase())) return true;
    } catch {
      // ignore
    }
    return false;
  }

  const useMock = readUseMock();

  if (useMock) {
    if (!mockInstance) mockInstance = createMockApi();
    // eslint-disable-next-line no-console
    console.info('DMS: using mock API');
    return mockInstance;
  }

  const real = useDmsApi();
  return useMemo(() => real, [real]);
}

