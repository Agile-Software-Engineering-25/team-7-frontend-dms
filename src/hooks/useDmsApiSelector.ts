import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';
import { useMemo } from 'react';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  // Toggle mock mode via window.__USE_DMS_MOCK__ = true; default to false in prod.
  const useMock = (window as any).__USE_DMS_MOCK__ === true;
  if (useMock) {
    if (!mockInstance) mockInstance = createMockApi();
    return mockInstance;
  }
  const real = useDmsApi();
  // ensure a stable reference across renders
  return useMemo(() => real, [real]);
}
