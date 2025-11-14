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
        const folderData = (await api.getFolder(folderId)) as FolderResponse;
        const parentId = folderData.folders?.parentId;

        const parentFolderData = (await api.getFolder(
          parentId ?? 'root'
        )) as FolderResponse;
        if (parentFolderData.name === 'root') {
          return [];
        }
        const parentGroups = parseStudyGroupIds(parentFolderData.studyGroupIds);

        // If parent has no groups assigned (length === 0), it's public to all groups
        // Return undefined to allow all groups to be selected
        if (parentGroups.length === 0) {
          return [];
        }

        // Parent has specific groups, so restrict to those groups
        return parentGroups;
      } catch (error) {
        console.error('Failed to get parent folder groups:', error);
        return undefined;
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
