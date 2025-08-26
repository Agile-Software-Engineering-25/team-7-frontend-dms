import useDmsApi from './useDmsApi';
import createMockApi from './useDmsApiMock';

let mockInstance: ReturnType<typeof createMockApi> | null = null;

export default function useDmsApiSelector() {
  // Toggle mock mode via window.__USE_DMS_MOCK__ = true; default to false in prod.
  const useMock = (window as any).__USE_DMS_MOCK__ === true;
  if (useMock) {
    if (!mockInstance) mockInstance = createMockApi();
    return mockInstance;
  }
  return useDmsApi();
}
