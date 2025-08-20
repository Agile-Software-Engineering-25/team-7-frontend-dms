export type FolderMeta = { id: string; name: string; parentId?: string };

// Parse flexible folder API responses into a stable FolderMeta shape.
export function parseFolderMetadata(
  folderData: unknown,
  currentId: string
): FolderMeta {
  const fd = folderData as Record<string, unknown> | undefined;
  let mdId = currentId;
  let mdName = currentId;
  let mdParent: string | undefined;

  if (!fd) return { id: mdId, name: mdName };

  const foldersField = fd['folders'];
  if (foldersField && typeof foldersField === 'object') {
    const f = foldersField as Record<string, unknown>;
    if (typeof f['id'] === 'string') mdId = f['id'];
    if (typeof f['name'] === 'string') mdName = f['name'];
    if (typeof f['parentId'] === 'string') mdParent = f['parentId'];
    return { id: mdId, name: mdName, parentId: mdParent };
  }

  if (typeof fd['id'] === 'string') {
    mdId = fd['id'] as string;
    if (typeof fd['name'] === 'string') mdName = fd['name'] as string;
    if (typeof fd['parentId'] === 'string') mdParent = fd['parentId'] as string;
    return { id: mdId, name: mdName, parentId: mdParent };
  }

  const subfolders = fd['subfolders'];
  if (Array.isArray(subfolders)) {
    for (const item of subfolders as unknown[]) {
      const it = item as Record<string, unknown>;
      if (typeof it['id'] === 'string' && it['id'] === currentId) {
        if (typeof it['id'] === 'string') mdId = it['id'];
        if (typeof it['name'] === 'string') mdName = it['name'];
        if (typeof it['parentId'] === 'string') mdParent = it['parentId'];
        break;
      }
    }
  }

  return { id: mdId, name: mdName, parentId: mdParent };
}
