import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { FolderResponse } from '@/@types/fileExplorer';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { parseStudyGroupIds } from '@utils/studyGroupHelpers';

/**
 * Custom hook for study group management
 * @returns Study groups state and handlers
 */
export function useStudyGroups() {
  const api = useDmsApiSelector();
  const { t } = useTranslation();
  const [studyGroups, setStudyGroups] = useState<string[] | undefined>(
    undefined
  );
  const [studyGroupsLoading, setStudyGroupsLoading] = useState(false);
  const [studyGroupsError, setStudyGroupsError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Manage Study Groups Dialog State
  const [manageGroupsDialogOpen, setManageGroupsDialogOpen] = useState(false);
  const [manageGroupsFolderId, setManageGroupsFolderId] = useState<
    string | null
  >(null);
  const [manageGroupsFolderName, setManageGroupsFolderName] =
    useState<string>('');
  const [manageGroupsCurrentGroups, setManageGroupsCurrentGroups] = useState<
    string[]
  >([]);
  const [manageGroupsParentGroups, setManageGroupsParentGroups] = useState<
    string[] | undefined
  >(undefined);

  // Lazy fetch function - only fetches once
  const fetchStudyGroups = useCallback(async () => {
    if (hasFetched) return; // Skip if already fetched

    setStudyGroupsLoading(true);
    setStudyGroupsError(null);
    try {
      const response = await api.getStudyGroups();
      setStudyGroups(response.groups.map((g) => g.name) || []);
      setHasFetched(true);
    } catch (error) {
      console.error('Failed to fetch study groups:', error);
      setStudyGroupsError(
        t(
          'documentManagement.studyGroups.loadError',
          'Failed to load study groups'
        )
      );
    } finally {
      setStudyGroupsLoading(false);
    }
  }, [api, t, hasFetched]);

  // Get parent folder's study groups for restriction
  const getParentFolderGroups = useCallback(
    async (folderId: string): Promise<string[] | undefined> => {
      try {
        // Get the current folder
        const folderData = (await api.getFolder(folderId)) as FolderResponse;
        const parentId = folderData.parentId;

        // If no parent or parent is root, no restriction (undefined = show all groups)
        if (!parentId || parentId === 'root') {
          return undefined;
        }

        // Get parent folder data
        const parentFolderData = (await api.getFolder(
          parentId
        )) as FolderResponse;

        // Check if parent is root by checking if it has no parentId
        if (!parentFolderData.parentId) {
          return undefined; // No restriction - show all groups
        }

        // Parse parent's study group IDs (handles both string and array formats)
        const parentGroups = parseStudyGroupIds(parentFolderData.studyGroupIds);

        // Return undefined to allow all groups to be selected
        if (parentGroups.length === 0) {
          return undefined; // No restriction - show all groups
        }

        // Parent has specific groups - restrict to those groups
        return parentGroups;
      } catch (error) {
        console.error('Failed to get parent folder groups:', error);
        return undefined; // On error, don't restrict
      }
    },
    [api]
  );

  const closeManageGroupsDialog = useCallback(() => {
    setManageGroupsDialogOpen(false);
    setManageGroupsFolderId(null);
    setManageGroupsFolderName('');
    setManageGroupsCurrentGroups([]);
    setManageGroupsParentGroups(undefined);
  }, []);

  return {
    studyGroups,
    studyGroupsLoading,
    studyGroupsError,
    manageGroupsDialogOpen,
    manageGroupsFolderId,
    manageGroupsFolderName,
    manageGroupsCurrentGroups,
    manageGroupsParentGroups,
    setManageGroupsDialogOpen,
    setManageGroupsFolderId,
    setManageGroupsFolderName,
    setManageGroupsCurrentGroups,
    setManageGroupsParentGroups,
    getParentFolderGroups,
    closeManageGroupsDialog,
    fetchStudyGroups,
  };
}
