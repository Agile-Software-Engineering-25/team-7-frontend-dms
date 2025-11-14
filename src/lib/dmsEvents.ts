/**
 * Small helpers and constants for DMS drag/drop and custom events.
 * Keep event names and payload shapes centralized for readability.
 */

export type DmsDragPayload = {
  id: string;
  type: 'folder' | 'document' | 'pdf' | 'other' | string;
};

export const MIME_DMS_ITEM = 'application/x-dms-item';

export const EVENT_REQUEST_MOVE = 'dms:request-move';
export const EVENT_DROP_ON_BREADCRUMB = 'dms:drop-on-breadcrumb';

export function emitRequestMove(id: string, itemType: string) {
  const ev = new CustomEvent(EVENT_REQUEST_MOVE, {
    detail: { id, itemType },
    bubbles: true,
  });
  // dispatch on document so components don't need direct refs
  document.dispatchEvent(ev);
}

export function emitDropOnBreadcrumb(item: DmsDragPayload, targetId: string) {
  const ev = new CustomEvent(EVENT_DROP_ON_BREADCRUMB, {
    detail: { item, targetId },
    bubbles: true,
  });
  document.dispatchEvent(ev);
}

/**
 * Parse drag payload from DataTransfer. Returns null if parsing fails.
 */
export function parseDragData(dt?: DataTransfer | null): DmsDragPayload | null {
  try {
    const raw = dt?.getData(MIME_DMS_ITEM);
    if (!raw) return null;
    return JSON.parse(raw) as DmsDragPayload;
  } catch {
    return null;
  }
}
