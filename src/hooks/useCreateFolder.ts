import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Item,
  FolderResponse,
  ConflictPendingAction,
} from '@/@types/fileExplorer';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import {
  parseStudyGroupIds,
  formatStudyGroupIds,
} from '@utils/studyGroupHelpers';

type UseCreateFolderProps = {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  currentFolderIdRef: React.MutableRefObject<string>;
  refresh: () => Promise<void>;
  showSnack: (msg: string, severity: 'success' | 'error' | 'info') => void;
  setConflictDialogOpen: (open: boolean) => void;
  setConflictName: (name: string) => void;
  setConflictType: (type: 'file' | 'folder') => void;
  setConflictPendingAction: (action: ConflictPendingAction | null) => void;
  fetchStudyGroups: () => Promise<void>;
};

/**
 * Custom hook for folder creation with conflict handling
 */
export function useCreateFolder({
  items,
  setItems,
  currentFolderIdRef,
  refresh,
  showSnack,
  setConflictDialogOpen,
  setConflictName,
  setConflictType,
  setConflictPendingAction,
  fetchStudyGroups,
}: UseCreateFolderProps) {
  const api = useDmsApiSelector();
  const { t } = useTranslation();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderStudyGroups, setNewFolderStudyGroups] = useState<string[]>(
    []
  );
  const [manageGroupsParentGroups, setManageGroupsParentGroups] = useState<
    string[] | undefined
  >(undefined);

  const handleOpenNewFolderDialog = async () => {
    // Reset selections
    setNewFolderName('');
    setNewFolderStudyGroups([]);

    // Fetch study groups if not already loaded
    await fetchStudyGroups();

    // Get parent folder's groups for restriction
    if (currentFolderIdRef.current !== 'root') {
      try {
        const folderData = (await api.getFolder(
          currentFolderIdRef.current
        )) as FolderResponse;
        const parentGroups = parseStudyGroupIds(folderData.studyGroupIds);

        if (parentGroups && parentGroups.length > 0) {
          setManageGroupsParentGroups(parentGroups);
          setNewFolderStudyGroups(parentGroups);
        } else {
          setManageGroupsParentGroups(undefined);
        }
      } catch (error) {
        console.error('Failed to get parent folder groups:', error);
        setManageGroupsParentGroups(undefined);
      }
    } else {
      setManageGroupsParentGroups(undefined);
    }

    setNewFolderOpen(true);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return setNewFolderOpen(false);

    // Check for duplicate folder name
    const duplicate = items.find(
      (item) => item.itemType === 'folder' && item.name === name
    );
    if (duplicate) {
      // Show conflict dialog instead of error
      setConflictName(name);
      setConflictType('folder');
      setConflictPendingAction({
        overwrite: async () => {
          try {
            // For folders, delete the existing one first
            await api.deleteFolder(duplicate.id);

            // Then create the new folder with the same name
            await api.createFolder(
              name,
              currentFolderIdRef.current,
              formatStudyGroupIds(newFolderStudyGroups)
            );

            await refresh();

            showSnack(
              t('documentManagement.snack.created', 'Created'),
              'success'
            );
            setNewFolderOpen(false);
            setNewFolderName('');
            setNewFolderStudyGroups([]);
          } catch (error) {
            console.error('Create folder failed:', error);
            showSnack(
              t('documentManagement.snack.createFailed', 'Create failed'),
              'error'
            );
          }
        },
        rename: async () => {
          try {
            // Find the next available increment
            let counter = 1;
            let newName = `${name} (${counter})`;

            while (
              items.some(
                (item) => item.itemType === 'folder' && item.name === newName
              )
            ) {
              counter++;
              newName = `${name} (${counter})`;
            }

            // Create folder with the new name
            await api.createFolder(
              newName,
              currentFolderIdRef.current,
              formatStudyGroupIds(newFolderStudyGroups)
            );

            await refresh();

            showSnack(
              t('documentManagement.snack.created', 'Created'),
              'success'
            );
            setNewFolderOpen(false);
            setNewFolderName('');
            setNewFolderStudyGroups([]);
          } catch (error) {
            console.error('Create folder failed:', error);
            showSnack(
              t('documentManagement.snack.createFailed', 'Create failed'),
              'error'
            );
          }
        },
      });
      setConflictDialogOpen(true);
      return;
    }

    try {
      const created = await api.createFolder(
        name,
        currentFolderIdRef.current,
        formatStudyGroupIds(newFolderStudyGroups)
      );
      setItems((prev) => [
        {
          id: created.id,
          name: created.name,
          size: 0,
          uploadDate: created.createdDate ?? new Date().toISOString(),
          itemType: 'folder',
        },
        ...prev,
      ]);
      showSnack(t('documentManagement.snack.created', 'Created'), 'success');
    } catch {
      showSnack(
        t('documentManagement.snack.createFailed', 'Create failed'),
        'error'
      );
    }
    setNewFolderOpen(false);
    setNewFolderName('');
    setNewFolderStudyGroups([]);
  };

  const handleCloseNewFolderDialog = () => {
    setNewFolderOpen(false);
    setNewFolderName('');
    setNewFolderStudyGroups([]);
  };

  return {
    newFolderOpen,
    newFolderName,
    newFolderStudyGroups,
    manageGroupsParentGroups,
    setNewFolderName,
    setNewFolderStudyGroups,
    handleOpenNewFolderDialog,
    handleCreateFolder,
    handleCloseNewFolderDialog,
  };
}
