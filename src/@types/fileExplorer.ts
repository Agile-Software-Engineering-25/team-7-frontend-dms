/**
 * Types for the FileExplorer component
 */

export type ItemType = 'folder' | 'document' | 'pdf' | 'other';

export type Item = {
  id: string;
  name: string;
  size: number; // bytes
  uploadDate: string; // ISO
  itemType: ItemType;
};

export type FolderResponse = {
  id?: string;
  name?: string;
  folders?: {
    id: string;
    name: string;
    parentId?: string;
    studyGroupIds?: string;
    createdDate?: string;
  };
  documents?: Array<{
    id: string;
    name: string;
    size: number;
    createdDate?: string;
    type?: string;
  }>;
  subfolders?: Array<{
    id: string;
    name: string;
    createdDate?: string;
    studyGroupIds?: string;
  }>;
  parentId?: string;
  studyGroupIds?: string;
};

export type DocForZip = {
  url: string;
  name: string;
  path: string;
};

export type PathItem = {
  id: string;
  name: string;
};

export type SnackState = {
  open: boolean;
  msg?: string | null;
  severity: 'success' | 'error' | 'info';
};

export type ConflictPendingAction = {
  overwrite: () => Promise<void>;
  rename: () => Promise<void>;
};

export type ConflictPendingActionWithoutOverwrite = {
  rename: () => Promise<void>;
};

export type DmsDragPayload = {
  id: string;
  type: ItemType | string;
};

// Constants
export const MAX_PATH_DEPTH = 50;
export const MAX_FILE_SIZE_MB = 5;
