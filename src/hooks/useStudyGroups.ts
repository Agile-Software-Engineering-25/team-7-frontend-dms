import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FolderResponse } from '@/@types/fileExplorer';
import { parseStudyGroupIds } from '@utils/studyGroupHelpers';

/**
 * Custom hook for study group management
 * @param api - DMS API instance
 * @returns Study groups state and handlers
 */
export function useStudyGroups(api: any) {
  const { t } = useTranslation();
  const [studyGroups, setStudyGroups] = useState<string[] | undefined>(
    undefined
  );
  const [studyGroupsLoading, setStudyGroupsLoading] = useState(false);
  const [studyGroupsError, setStudyGroupsError] = useState<string | null>(null);

  // Manage Study Groups Dialog State
  const [manageGroupsDialogOpen, setManageGroupsDialogOpen] = useState(false);
  const [manageGroupsFolderId, setManageGroupsFolderId] = useState<
    string | null
  >(null);
  const [manageGroupsFolderName, setManageGroupsFolderName] = useState<string>('');
  const [manageGroupsCurrentGroups, setManageGroupsCurrentGroups] = useState<
    string[]
  >([]);
  const [manageGroupsParentGroups, setManageGroupsParentGroups] = useState<
    string[] | undefined
  >(undefined);

  // Fetch study groups on mount
  useEffect(() => {
    const fetchStudyGroups = async () => {
      setStudyGroupsLoading(true);
      setStudyGroupsError(null);
      try {
        const response = await api.getStudyGroups();
        setStudyGroups(response.groups.map((g: any) => g.name) || []);
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
    };
    fetchStudyGroups();
  }, [api, t]);

  // Get parent folder's study groups for restriction
  const getParentFolderGroups = async (
    folderId: string
  ): Promise<string[] | undefined> => {
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
  };

  const closeManageGroupsDialog = () => {
    setManageGroupsDialogOpen(false);
    setManageGroupsFolderId(null);
    setManageGroupsFolderName('');
    setManageGroupsCurrentGroups([]);
    setManageGroupsParentGroups(undefined);
  };

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
  };
}
