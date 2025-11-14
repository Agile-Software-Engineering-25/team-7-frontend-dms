import { useState, useRef, useCallback } from 'react';
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
  const currentFolderIdRef = useRef<string>('root');
  const [currentPath, setCurrentPath] = useState<PathItem[]>([
    { id: 'root', name: 'root' },
  ]);
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

  const refresh = useCallback(async () => {
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;
    try {
      const folder = (await api.getFolder(
        currentFolderIdRef.current
      )) as FolderResponse;
      currentFolderIdRef.current = folder.folders?.id ?? folder.id ?? 'root';
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
    setCurrentPath((prev) => [...prev, newElement]);
  }, []);

  const handleOpenFolder = async (id: string, name: string) => {
    if (id != currentFolderIdRef.current) {
      try {
        currentFolderIdRef.current = id;
        buildPathFromFolder(id, name);
        refresh();
      } catch {
        await sleep(200);
        currentFolderIdRef.current = id;
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
      setCurrentPath(newPath);
      refresh();
    } else {
      refresh();
    }
  };

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
