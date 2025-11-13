import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo } from 'react';
import type { DmsApi } from '@/@types/dmsApi';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

const ALLOW_MOCK_TOGGLE = false; // toggle true to allow mock locally. DO NOT PUSH THIS CHANGE!

export default function useDmsApiSelector(): DmsApi {
  const win = window as unknown as {
    __USE_DMS_MOCK__?: boolean;
    location: Location;
    history: History;
  };

  function readUseMock(): boolean {
    try {
      if (win.__USE_DMS_MOCK__ === true) return true;
      const qp = new URLSearchParams(win.location.search || '');
      const qpMock = qp.get('mock');

      const wantsMock =
        typeof qpMock === 'string' &&
        ['1', 'true', 'yes'].includes(qpMock.toLowerCase());

      // redirect user if toggle is disabled
      if (wantsMock && !ALLOW_MOCK_TOGGLE) {
        const url = new URL(win.location.href);
        url.searchParams.delete('mock');
        // use history.replaceState to avoid page reload
        win.history.replaceState({}, '', url.toString());
        console.info(
          'Mock deactivited by config: redirecting to',
          url.toString()
        );
        return false;
      }

      if (wantsMock && ALLOW_MOCK_TOGGLE) return true;
    } catch {
      // ignore
    }
    return false;
  }

  const real = useDmsApi();
  const realMemo = useMemo(() => real, [real]);

  const useMock = readUseMock();
  if (useMock) {
    mockInstance = createMockApi();
    console.info('DMS: using mock API');
    return mockInstance;
  }

  return realMemo;
}
