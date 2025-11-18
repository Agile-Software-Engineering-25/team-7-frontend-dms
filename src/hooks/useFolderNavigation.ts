import { useState, useRef, useCallback, useEffect } from 'react';
import type { Item, FolderResponse, PathItem } from '@/@types/fileExplorer';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { sleep } from '@utils/fileHelpers';

/**
 * Custom hook for folder navigation
 * @returns Folder navigation state and handlers
 */
export function useFolderNavigation() {
  const api = useDmsApiSelector();
  const [items, setItems] = useState<Item[]>([]);
  // Restore persisted folder id and path if available
  const initialFolderId = (() => {
    try {
      const saved = localStorage.getItem('dmsCurrentFolderId');
      return saved || 'root';
    } catch {
      return 'root';
    }
  })();
  const currentFolderIdRef = useRef<string>(initialFolderId);
  const [currentPath, setCurrentPath] = useState<PathItem[]>(() => {
    try {
      const saved = localStorage.getItem('dmsCurrentPath');
      if (saved) {
        const parsed = JSON.parse(saved) as PathItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [{ id: 'root', name: 'root' }];
  });
  const refreshInProgressRef = useRef(false);
  const itemsRef = useRef<Item[]>(items);

  // Keep itemsRef in sync
  useState(() => {
    itemsRef.current = items;
  });

  const currentFolderName =
    (currentPath.length > 0
      ? currentPath[currentPath.length - 1].name
      : 'documents') || 'documents';

  // Persist helpers
  const persistFolderId = (id: string) => {
    try {
      localStorage.setItem('dmsCurrentFolderId', id);
    } catch {
      // ignore
    }
  };
  const persistPath = (path: PathItem[]) => {
    try {
      localStorage.setItem('dmsCurrentPath', JSON.stringify(path));
    } catch {
      // ignore
    }
  };

  const refresh = useCallback(async () => {
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;
    try {
      const folder = (await api.getFolder(
        currentFolderIdRef.current
      )) as FolderResponse;
      currentFolderIdRef.current = folder.folders?.id ?? folder.id ?? 'root';
      // persist resolved folder id (in case API normalized it)
      persistFolderId(currentFolderIdRef.current);
      const docs: Item[] = (folder.documents || []).map((d) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        uploadDate: d.createdDate ?? new Date().toISOString(),
        itemType: d.type === 'application/pdf' ? 'pdf' : 'document',
        tags: d.tags || [],
      }));
      const subfolders: Item[] = (folder.subfolders || []).map((f) => ({
        id: f.id,
        name: f.name,
        size: 0,
        uploadDate: f.createdDate ?? new Date().toISOString(),
        itemType: 'folder' as const,
      }));
      // Alphabetisch sortieren (case-insensitive), Ordner vor Dateien
      const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
      subfolders.sort((a, b) => collator.compare(a.name, b.name));
      docs.sort((a, b) => collator.compare(a.name, b.name));
      const allItems = [...subfolders, ...docs];
      setItems(allItems);
    } catch {
      // ignore for now
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [api]);

  const buildPathFromFolder = useCallback((id: string, name: string) => {
    if (name == 'root') return;
    if (!id || !name) return;
    const newElement = { id: id, name: name };
    setCurrentPath((prev) => {
      const next = [...prev, newElement];
      persistPath(next);
      return next;
    });
  }, []);

  const handleOpenFolder = async (id: string, name: string) => {
    if (id != currentFolderIdRef.current) {
      try {
        currentFolderIdRef.current = id;
        persistFolderId(id);
        buildPathFromFolder(id, name);
        refresh();
      } catch {
        await sleep(200);
        currentFolderIdRef.current = id;
        persistFolderId(id);
        buildPathFromFolder(id, name);
        refresh();
      }
    }
  };

  const handleNavigatePath = (id: string, name: string) => {
    if (currentFolderIdRef.current != id) {
      let newPath: PathItem[] = [];

      let finished = false;
      if (name != 'root' && id != 'root') {
        for (const p of currentPath) {
          if (finished) continue;
          if (p.id == id) {
            finished = true;
          }
          newPath.push(p);
        }
      } else {
        newPath = [{ id: 'root', name: 'root' }];
      }

      currentFolderIdRef.current = id;
      persistFolderId(id);
      setCurrentPath(newPath);
      persistPath(newPath);
      refresh();
    } else {
      refresh();
    }
  };

  // Keep persisted path in sync if it changes externally
  useEffect(() => {
    persistPath(currentPath);
  }, [currentPath]);

  return {
    items,
    setItems,
    currentFolderIdRef,
    currentPath,
    setCurrentPath,
    currentFolderName,
    itemsRef,
    refresh,
    buildPathFromFolder,
    handleOpenFolder,
    handleNavigatePath,
  };
}
