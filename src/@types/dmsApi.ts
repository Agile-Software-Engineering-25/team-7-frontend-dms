/**
 * Type definition for DMS API
 */

import type { FolderResponse, TagEntity } from './fileExplorer';

export interface DmsApi {
  // Folder operations
  getFolder: (folderId: string) => Promise<FolderResponse>;
  createFolder: (
    name: string,
    parentId?: string,
    studyGroupIds?: string[]
  ) => Promise<{ id: string; name: string; createdDate?: string }>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<unknown>;
  moveFolder: (folderId: string, targetFolderId?: string) => Promise<unknown>;
  updateFolderStudyGroups: (
    folderId: string,
    studyGroupIds: string[]
  ) => Promise<unknown>;

  // Document operations
  uploadDocument: (file: File, folderId: string) => Promise<unknown>;
  downloadDocument: (documentId: string) => Promise<{
    url: string;
    name: string;
    type?: string;
  }>;
  downloadAsZip: (
    documents: Array<{ url: string; name: string; path: string }>,
    folderName?: string
  ) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  renameDocument: (documentId: string, newName: string) => Promise<unknown>;
  moveDocument: (
    documentId: string,
    targetFolderId: string
  ) => Promise<unknown>;
  convertOfficeToPdf: (documentId: string) => Promise<{
    url: string;
    name: string;
    type: string;
  }>;

  // Optional method for document metadata
  getDocumentMetadata?: (documentId: string) => Promise<{
    folderId?: string;
    [key: string]: unknown;
  }>;

  // Study groups
  getStudyGroups: () => Promise<{ groups: Array<{ name: string }> }>;

  // Tag operations
  getAllTags: () => Promise<TagEntity[]>;
  createTag: (tagName: string) => Promise<TagEntity>;
  updateTag: (tagUuid: string, tagName: string) => Promise<TagEntity>;
  deleteTag: (tagUuid: string) => Promise<void>;
  updateDocumentTags: (documentId: string, tags: string[]) => Promise<unknown>;
}
