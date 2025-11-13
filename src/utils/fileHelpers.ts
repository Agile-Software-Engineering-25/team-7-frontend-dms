/**
 * Helper functions for file operations
 */

import type { DocForZip, FolderResponse } from '@/@types/fileExplorer';

/**
 * Recursively collect all documents from a folder and its subfolders
 * @param api - DMS API instance
 * @param folderId - The folder ID to collect from
 * @param prefix - Path prefix for the documents
 * @returns Array of documents with their URLs and paths
 */
export async function collectDocsFromFolderWithPaths(
  api: any,
  folderId: string,
  prefix: string
): Promise<DocForZip[]> {
  const folder = (await api.getFolder(folderId)) as FolderResponse;
  const docsHere = await Promise.all(
    (folder.documents || []).map(async (d) => {
      const { url, name } = await api.downloadDocument(d.id);
      return { url, name, path: prefix };
    })
  );
  const nested: DocForZip[] = [];
  for (const sf of folder.subfolders || []) {
    const childPrefix = `${prefix}/${sf.name}`;
    const inside = await collectDocsFromFolderWithPaths(api, sf.id, childPrefix);
    nested.push(...inside);
  }
  return [...docsHere, ...nested];
}

/**
 * Check if a file is too large
 * @param file - The file to check
 * @param maxSizeMB - Maximum size in MB
 * @returns True if the file is too large
 */
export function isTooLarge(file: File, maxSizeMB: number): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
