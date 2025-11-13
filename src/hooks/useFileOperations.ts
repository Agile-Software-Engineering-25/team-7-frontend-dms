import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Item,
  FolderResponse,
  SnackState,
  ConflictPendingAction,
  ConflictPendingActionWithoutOverwrite,
} from '@/@types/fileExplorer';

type UseFileOperationsProps = {
  api: any;
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  currentFolderIdRef: React.MutableRefObject<string>;
  refresh: () => Promise<void>;
};

/**
 * Custom hook for file and folder operations
 * Handles upload, download, rename, delete, move operations
 */
export function useFileOperations({
  api,
  items,
  setItems,
  currentFolderIdRef,
  refresh,
}: UseFileOperationsProps) {
  const { t } = useTranslation();

  // Active item state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Rename dialog state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFolderConfirmOpen, setDeleteFolderConfirmOpen] = useState(false);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Conflict dialog state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [
    conflictDialogWithoutOverwriteOpen,
    setConflictDialogWithoutOverwriteOpen,
  ] = useState(false);
  const [conflictName, setConflictName] = useState('');
  const [conflictType, setConflictType] = useState<'file' | 'folder'>('file');
  const [conflictPendingAction, setConflictPendingAction] =
    useState<ConflictPendingAction | null>(null);
  const [
    conflictPendingActionWithoutOverwrite,
    setConflictPendingActionWithoutOverwrite,
  ] = useState<ConflictPendingActionWithoutOverwrite | null>(null);

  // Move dialog state
  const [moveChooserOpen, setMoveChooserOpen] = useState(false);
  const [moveSourceId, setMoveSourceId] = useState<string | null>(null);
  const [moveSourceType, setMoveSourceType] = useState<
    Item['itemType'] | string | null
  >(null);

  // Snackbar state
  const [snack, setSnack] = useState<SnackState>({
    open: false,
    msg: null,
    severity: 'success',
  });

  const handleClose = () => {
    setActiveId(null);
  };

  const getItemById = (id?: string | null) =>
    items.find((i) => i.id === (id ?? ''));

  const showSnack = (
    msg: string,
    severity: 'success' | 'error' | 'info' = 'success'
  ) => {
    setSnack({ open: true, msg, severity });
  };

  const showSnackSequence = async (
    messages: Array<{ msg: string; severity: 'success' | 'error' | 'info' }>
  ) => {
    for (let i = 0; i < messages.length; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      showSnack(messages[i].msg, messages[i].severity);
    }
  };

  // Rename operations
  const handleOpenRename = (id: string) => {
    setActiveId(id);
    const it = getItemById(id);
    setRenameValue(it?.name ?? '');
    setRenameOpen(true);
  };

  const handleRename = async () => {
    if (!activeId) return handleClose();
    const it = items.find((i) => i.id === activeId);
    if (!it) return handleClose();
    const newName = renameValue.trim();
    if (newName && it) {
      setItems((prev) =>
        prev.map((p) => (p.id === it.id ? { ...p, name: newName } : p))
      );
      try {
        if (it.itemType === 'folder') {
          const targetFolderData = (await api.getFolder(
            activeId
          )) as FolderResponse;
          const parentFolderData = (await api.getFolder(
            targetFolderData.folders?.parentId ?? 'root'
          )) as FolderResponse;
          const targetFolders = parentFolderData.subfolders || [];
          const existingFolder = targetFolders.find(
            (d) => d.name === newName && d.id !== activeId
          );

          if (existingFolder) {
            setConflictName(newName ?? '');
            setConflictType('folder');
            setConflictPendingAction({
              overwrite: async () => {
                await api.deleteFolder(existingFolder.id);
                await api.renameFolder(activeId, newName);
                setItems((prev) => prev.filter((i) => i.id !== activeId));
                await refresh();
                showSnack(
                  t('documentManagement.snack.renamed', 'Renamed'),
                  'success'
                );
              },
              rename: async () => {
                let newName2 = renameValue.trim();
                const lastDotIndex = newName2.lastIndexOf('.');
                const baseName =
                  lastDotIndex > 0
                    ? newName2.substring(0, lastDotIndex)
                    : newName2;
                const extension =
                  lastDotIndex > 0 ? newName2.substring(lastDotIndex) : '';

                let counter = 1;
                newName2 = `${baseName} (${counter})${extension}`;
                while (targetFolders.some((d) => d.name === newName2)) {
                  counter++;
                  newName2 = `${baseName} (${counter})${extension}`;
                }

                await api.renameFolder(activeId, newName2);
                setItems((prev) => prev.filter((i) => i.id !== activeId));
                await refresh();
                showSnack(
                  t('documentManagement.snack.renamed', 'Renamed'),
                  'success'
                );
              },
            });
            setConflictDialogOpen(true);
            setMoveChooserOpen(false);
            setMoveSourceId(null);
          }
        } else {
          const parentFolderData = (await api.getFolder(
            currentFolderIdRef.current
          )) as FolderResponse;
          const targetDocuments = parentFolderData.documents || [];
          const existingDocuments = targetDocuments.find(
            (d) => d.name === newName && d.id !== activeId
          );

          if (existingDocuments) {
            setConflictName(newName ?? '');
            setConflictType('file');
            setConflictPendingAction({
              overwrite: async () => {
                await api.deleteDocument(existingDocuments.id);
                await api.renameDocument(activeId, newName);
                setItems((prev) => prev.filter((i) => i.id !== activeId));
                await refresh();
                showSnack(
                  t('documentManagement.snack.renamed', 'Renamed'),
                  'success'
                );
              },
              rename: async () => {
                let newName2 = renameValue.trim();
                const lastDotIndex = newName2.lastIndexOf('.');
                const baseName =
                  lastDotIndex > 0
                    ? newName2.substring(0, lastDotIndex)
                    : newName2;
                const extension =
                  lastDotIndex > 0 ? newName2.substring(lastDotIndex) : '';

                let counter = 1;
                newName2 = `${baseName} (${counter})${extension}`;
                while (targetDocuments.some((d) => d.name === newName2)) {
                  counter++;
                  newName2 = `${baseName} (${counter})${extension}`;
                }

                await api.renameDocument(activeId, newName2);
                setItems((prev) => prev.filter((i) => i.id !== activeId));
                await refresh();
                showSnack(
                  t('documentManagement.snack.renamed', 'Renamed'),
                  'success'
                );
              },
            });
            setConflictDialogOpen(true);
            setMoveChooserOpen(false);
            setMoveSourceId(null);
          }
        }
      } catch {
        setItems((prev) => prev.map((p) => (p.id === it.id ? it : p)));
        showSnack(
          t('documentManagement.snack.renameFailed', 'Rename failed'),
          'error'
        );
      }
    }
    setRenameOpen(false);
    setRenameValue('');
    handleClose();
  };

  // Delete operations
  const handleOpenDelete = (id: string) => {
    setActiveId(id);
    const it = getItemById(id);
    if (it?.itemType === 'folder') {
      setDeleteFolderConfirmOpen(true);
    } else {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!activeId) return setDeleteConfirmOpen(false);
    const it = items.find((i) => i.id === activeId);
    if (!it) return setDeleteConfirmOpen(false);
    try {
      if (it.itemType === 'folder') {
        await api.deleteFolder(it.id);
      } else {
        await api.deleteDocument(it.id);
      }
      setItems((prev) => prev.filter((p) => p.id !== activeId));
      showSnack(t('documentManagement.snack.deleted', 'Deleted'), 'success');
    } catch {
      showSnack(
        t('documentManagement.snack.deleteFailed', 'Delete failed'),
        'error'
      );
    }
    setDeleteConfirmOpen(false);
    handleClose();
  };

  const handleDeleteFolderConfirmed = async () => {
    if (!activeId) return setDeleteFolderConfirmOpen(false);
    const it = items.find((i) => i.id === activeId);
    if (!it) return setDeleteFolderConfirmOpen(false);
    try {
      await api.deleteFolder(it.id);
      setItems((prev) => prev.filter((p) => p.id !== activeId));
      showSnack(t('documentManagement.snack.deleted', 'Deleted'), 'success');
    } catch {
      showSnack(
        t('documentManagement.snack.deleteFailed', 'Delete failed'),
        'error'
      );
    }
    setDeleteFolderConfirmOpen(false);
    handleClose();
  };

  // Upload operations
  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadDocument = async () => {
    if (selectedFiles.length === 0) {
      showSnack(
        t('documentManagement.snack.noFiles', 'No files selected'),
        'error'
      );
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // Use constant from types

    const validFiles: File[] = [];
    const oversizedFiles: File[] = [];
    const duplicateFiles: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > maxSizeBytes) {
        oversizedFiles.push(file);
      } else if (items.some((item) => item.name === file.name)) {
        duplicateFiles.push(file);
      } else {
        validFiles.push(file);
      }
    }

    const messages: Array<{ msg: string; severity: 'success' | 'error' }> = [];
    const duplicate = selectedFiles.find((file) =>
      items.some((item) => item.name === file.name)
    );

    if (duplicate) {
      const existingItem = items.find((item) => item.name === duplicate.name);
      setConflictName(duplicate.name);
      setConflictType('file');
      setConflictPendingAction({
        overwrite: async () => {
          try {
            if (existingItem) {
              await api.deleteDocument(existingItem.id);
            }
            for (const file of selectedFiles) {
              await api.uploadDocument(file, currentFolderIdRef.current);
            }
            await refresh();
            showSnack(
              t('documentManagement.snack.uploaded', 'Uploaded successfully'),
              'success'
            );
            handleCloseUpload();
          } catch (error) {
            console.error('Upload failed:', error);
            showSnack(
              t('documentManagement.snack.uploadFailed', 'Upload failed'),
              'error'
            );
          }
        },
        rename: async () => {
          try {
            for (const file of selectedFiles) {
              await api.uploadDocument(file, currentFolderIdRef.current);
            }
            await refresh();
            showSnack(
              t('documentManagement.snack.uploaded', 'Uploaded successfully'),
              'success'
            );
            handleCloseUpload();
          } catch (error) {
            console.error('Upload failed:', error);
            showSnack(
              t('documentManagement.snack.uploadFailed', 'Upload failed'),
              'error'
            );
          }
        },
      });
      setConflictDialogOpen(true);
      return;
    }

    let uploadSuccessCount = 0;
    const failedFiles: string[] = [];

    for (const file of validFiles) {
      try {
        await api.uploadDocument(file, currentFolderIdRef.current);
        uploadSuccessCount++;
      } catch {
        failedFiles.push(file.name);
      }
    }

    if (failedFiles.length > 0) {
      const failedNames = failedFiles.join(', ');
      const defaultValue =
        uploadSuccessCount > 0
          ? 'Uploaded partially. Failed for file'
          : 'Upload failed for files';
      messages.push({
        msg: t('documentManagement.snack.uploadFailed', {
          defaultValue,
          fileName: failedNames,
          fileNames: failedNames,
        }),
        severity: 'error',
      });
    }

    if (uploadSuccessCount > 0) {
      await refresh();
      const successMessage = t(
        'documentManagement.snack.uploaded',
        'Uploaded successfully'
      );
      if (messages.length === 0) {
        messages.push({ msg: successMessage, severity: 'success' });
      } else {
        messages.unshift({ msg: successMessage, severity: 'success' });
      }
    }

    if (messages.length > 0) {
      await showSnackSequence(messages);
    }

    setUploadOpen(false);
    setSelectedFiles([]);
    await refresh();
  };

  // Conflict resolution
  const handleConflictAction = async (
    action: 'overwrite' | 'rename' | 'cancel'
  ) => {
    setConflictDialogOpen(false);

    if (action === 'cancel') {
      setConflictPendingAction(null);
      return;
    }

    if (!conflictPendingAction) return;

    if (action === 'overwrite') {
      await conflictPendingAction.overwrite();
    } else if (action === 'rename') {
      await conflictPendingAction.rename();
    }

    setConflictPendingAction(null);
  };

  const handleConflictActionWithoutOverwrite = async (
    action: 'rename' | 'cancel'
  ) => {
    setConflictDialogWithoutOverwriteOpen(false);

    if (action === 'cancel') {
      setConflictPendingAction(null);
      return;
    }

    if (!conflictPendingActionWithoutOverwrite) return;
    if (action === 'rename') {
      await conflictPendingActionWithoutOverwrite.rename();
    }

    setConflictPendingAction(null);
  };

  return {
    // State
    activeId,
    renameOpen,
    renameValue,
    deleteConfirmOpen,
    deleteFolderConfirmOpen,
    uploadOpen,
    selectedFiles,
    fileInputRef,
    conflictDialogOpen,
    conflictDialogWithoutOverwriteOpen,
    conflictName,
    conflictType,
    conflictPendingAction,
    moveChooserOpen,
    moveSourceId,
    moveSourceType,
    snack,

    // Setters
    setRenameOpen,
    setRenameValue,
    setDeleteConfirmOpen,
    setDeleteFolderConfirmOpen,
    setUploadOpen,
    setSelectedFiles,
    setConflictDialogOpen,
    setConflictDialogWithoutOverwriteOpen,
    setMoveChooserOpen,
    setMoveSourceId,
    setMoveSourceType,
    setSnack,
    setConflictPendingAction,
    setConflictPendingActionWithoutOverwrite,
    setConflictName,
    setConflictType,

    // Handlers
    handleClose,
    handleOpenRename,
    handleRename,
    handleOpenDelete,
    handleDelete,
    handleDeleteFolderConfirmed,
    handleRemoveSelectedFile,
    handleCloseUpload,
    handleUploadDocument,
    handleConflictAction,
    handleConflictActionWithoutOverwrite,
    showSnack,
    showSnackSequence,
    getItemById,
  };
}
