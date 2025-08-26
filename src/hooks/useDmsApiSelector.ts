import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo } from 'react';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  // Give a narrow, typed view of window rather than `any`.
  const win = window as unknown as {
    __USE_DMS_MOCK__?: boolean;
    location: Location;
  };

  function readUseMock(): boolean {
    try {
      if (win.__USE_DMS_MOCK__ === true) return true;
      const qp = new URLSearchParams(win.location.search || '');
      const qpMock = qp.get('mock');
      if (
        typeof qpMock === 'string' &&
        ['1', 'true', 'yes'].includes(qpMock.toLowerCase())
      )
        return true;
    } catch {
      // ignore
    }
    return false;
  }

  // Call hooks unconditionally to satisfy Rules of Hooks. We still decide which
  // API to return at runtime.
  const real = useDmsApi();
  const realMemo = useMemo(() => real, [real]);

  const useMock = readUseMock();
  if (useMock) {
    if (!mockInstance) mockInstance = createMockApi();
    console.info('DMS: using mock API');
    return mockInstance;
  }

  return realMemo;
}
