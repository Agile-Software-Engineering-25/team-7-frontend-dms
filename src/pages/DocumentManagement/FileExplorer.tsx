import * as React from 'react';
import { Alert, Box, List, Snackbar, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { useCanAccess } from '@/lib/permissions';

// Custom hooks
import { useSearch } from '@hooks/useSearch';
import { useStudyGroups } from '@hooks/useStudyGroups';
import { useFolderNavigation } from '@hooks/useFolderNavigation';
import { useFileOperations } from '@hooks/useFileOperations';
import { useDownload } from '@hooks/useDownload';
import { usePreview } from '@hooks/usePreview';
import { useCreateFolder } from '@hooks/useCreateFolder';
import useTags from '@hooks/useTags';

// Components
import FileListItem from '@components/FileListItem/FileListItem';
import FileViewer from '@components/FileViewer/FileViewer';
import BreadcrumbBar from '@components/BreadcrumbBar/BreadcrumbBar';
import DownloadDialog from '@components/DownloadDialog/DownloadDialog';
import ConflictDialog from '@components/ConflictDialog/ConflictDialog';
import ConflictDialogWithoutOverwrite from '@components/ConflictDialogWithoutOverwrite/ConflictDialogWithoutOverwrite';
import MoveDialog from '@components/MoveDialog/MoveDialog';
import ManageStudyGroupsDialog from '@components/ManageStudyGroupsDialog/ManageStudyGroupsDialog';
import FileExplorerToolbar from '@components/FileExplorerToolbar/FileExplorerToolbar';
import RenameDialog from '@components/RenameDialog/RenameDialog';
import DeleteConfirmDialog from '@components/DeleteConfirmDialog/DeleteConfirmDialog';
import DeleteFolderConfirmDialog from '@components/DeleteFolderConfirmDialog/DeleteFolderConfirmDialog';
import NewFolderDialog from '@components/NewFolderDialog/NewFolderDialog';
import UploadDialog from '@components/UploadDialog/UploadDialog';
import TagEditor from '@components/TagEditor/TagEditor';

// Types and utils
import type {
  DmsDragPayload,
  FolderResponse,
  Item,
  TagEntity,
} from '@/@types/fileExplorer';
import { MAX_PATH_DEPTH } from '@/@types/fileExplorer';
import { parseFolderMetadata } from '@utils/folderMetadata';
import { parseStudyGroupIds } from '@utils/studyGroupHelpers';

export default function FileExplorer(): React.ReactElement {
  const { canAccess } = useCanAccess();
  const { t } = useTranslation();
  const api = useDmsApiSelector();

  // Navigation hook
  const navigation = useFolderNavigation();
  const {
    items,
    setItems,
    currentFolderIdRef,
    currentPath,
    itemsRef,
    refresh,
    handleOpenFolder,
    handleNavigatePath,
  } = navigation;

  // Tags hook
  const tagsHook = useTags();
  const [selectedTags, setSelectedTags] = React.useState<TagEntity[]>([]);
  const [tagEditorOpen, setTagEditorOpen] = React.useState(false);
  const [tagEditorDocumentId, setTagEditorDocumentId] = React.useState('');
  const [tagEditorDocumentName, setTagEditorDocumentName] = React.useState('');
  const [tagEditorCurrentTags, setTagEditorCurrentTags] = React.useState<
    TagEntity[]
  >([]);

  // Search hook (now includes tag filtering)
  const { searchQuery, filteredItems, handleSearch, clearSearch } = useSearch(
    items,
    selectedTags
  );

  // Study groups hook
  const studyGroupsHook = useStudyGroups();

  // File operations hook
  const fileOps = useFileOperations({
    items,
    setItems,
    currentFolderIdRef,
    refresh,
  });

  // Download hook
  const download = useDownload({
    items,
    showSnack: fileOps.showSnack,
  });

  // Preview hook
  const preview = usePreview({
    items,
    showSnack: fileOps.showSnack,
  });

  // Create folder hook
  const createFolder = useCreateFolder({
    items,
    setItems,
    currentFolderIdRef,
    refresh,
    showSnack: fileOps.showSnack,
    setConflictDialogOpen: fileOps.setConflictDialogOpen,
    setConflictName: fileOps.setConflictName,
    setConflictType: fileOps.setConflictType,
    setConflictPendingAction: fileOps.setConflictPendingAction,
    fetchStudyGroups: studyGroupsHook.fetchStudyGroups,
  });

  // Initial load
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Clear search when folder changes
  React.useEffect(() => {
    clearSearch();
  }, [currentFolderIdRef.current]);

  // Handle manage study groups dialog
  const handleOpenManageGroups = async (folderId: string) => {
    const folder = items.find((i) => i.id === folderId);
    if (!folder) return;

    // Fetch study groups if not already loaded
    await studyGroupsHook.fetchStudyGroups();

    studyGroupsHook.setManageGroupsFolderId(folderId);
    studyGroupsHook.setManageGroupsFolderName(folder.name);

    try {
      const folderData = (await api.getFolder(folderId)) as FolderResponse;
      const currentGroups = parseStudyGroupIds(folderData.studyGroupIds);
      studyGroupsHook.setManageGroupsCurrentGroups(currentGroups);

      const parentGroups =
        await studyGroupsHook.getParentFolderGroups(folderId);
      studyGroupsHook.setManageGroupsParentGroups(parentGroups);

      studyGroupsHook.setManageGroupsDialogOpen(true);
    } catch (error) {
      console.error('Failed to open manage groups dialog:', error);
      fileOps.showSnack(
        t('documentManagement.studyGroups.loadError', 'Failed to load groups'),
        'error'
      );
    }
  };

  const handleSaveStudyGroups = async (selectedGroups: string[]) => {
    if (!studyGroupsHook.manageGroupsFolderId) return;

    try {
      await api.updateFolderStudyGroups(
        studyGroupsHook.manageGroupsFolderId,
        selectedGroups
      );
      fileOps.showSnack(
        t('documentManagement.studyGroups.saved', 'Groups updated'),
        'success'
      );
      await refresh();
    } catch (error) {
      console.error('Failed to save study groups:', error);
      fileOps.showSnack(
        t(
          'documentManagement.studyGroups.saveFailed',
          'Failed to update groups'
        ),
        'error'
      );
      throw error;
    }
  };

  // Tag management handlers
  const handleOpenTagEditor = (documentId: string) => {
    const document = items.find((i) => i.id === documentId);
    if (!document || document.itemType === 'folder') return;

    setTagEditorDocumentId(documentId);
    setTagEditorDocumentName(document.name);
    setTagEditorCurrentTags(document.tags || []);
    setTagEditorOpen(true);
  };

  const handleSaveTags = async (tagUuids: string[]) => {
    try {
      await tagsHook.updateDocumentTags(tagEditorDocumentId, tagUuids);
      fileOps.showSnack(
        t('documentManagement.tags.saved', 'Tags updated'),
        'success'
      );
      await refresh();
    } catch (error) {
      console.error('Failed to save tags:', error);
      fileOps.showSnack(
        t('documentManagement.tags.saveFailed', 'Failed to update tags'),
        'error'
      );
      throw error;
    }
  };

  // Move logic (kept in FileExplorer due to complexity)
  const handleMove = async (
    sourceId: string,
    sourceType: Item['itemType'] | string,
    targetFolderId: string
  ) => {
    if (!sourceId || !targetFolderId) return;

    const isDescendant = async (targetId: string, sourceIdCheck: string) => {
      try {
        let current: string | undefined = targetId;
        let depth = 0;
        while (current && depth < MAX_PATH_DEPTH) {
          if (current === sourceIdCheck) return true;
          if (current === 'root') break;
          const folderData = (await api.getFolder(current)) as FolderResponse;
          const md = parseFolderMetadata(folderData, current);
          if (!md.parentId) break;
          current = md.parentId;
          depth += 1;
        }
        return false;
      } catch {
        return true;
      }
    };

    try {
      if (sourceType === 'folder') {
        if (sourceId === targetFolderId) {
          fileOps.showSnack(
            t(
              'documentManagement.snack.invalidMove',
              'Cannot move a folder into itself or its descendant.'
            ),
            'error'
          );
          return;
        }

        try {
          const srcFolderData = (await api.getFolder(
            sourceId
          )) as FolderResponse;
          const srcMeta = parseFolderMetadata(srcFolderData, sourceId);
          const srcParent = srcMeta.parentId ?? 'root';
          if (srcParent === targetFolderId) {
            fileOps.showSnack(
              t(
                'documentManagement.snack.alreadyInFolderFolder',
                'Cannot move folder: it is already in the selected folder.'
              ),
              'error'
            );
            return;
          }
        } catch {
          // ignore
        }

        const bad = await isDescendant(targetFolderId, sourceId);
        if (bad) {
          fileOps.showSnack(
            t(
              'documentManagement.snack.invalidMove',
              'Cannot move a folder into itself or its descendant.'
            ),
            'error'
          );
          return;
        }

        const targetFolderData = (await api.getFolder(
          targetFolderId
        )) as FolderResponse;
        const targetSubfolders = targetFolderData.subfolders || [];
        const sourceFolderData = (await api.getFolder(
          sourceId
        )) as FolderResponse;
        const sourceMeta = parseFolderMetadata(sourceFolderData, sourceId);
        const sourceFolderName = sourceMeta.name;
        const existingFolder = targetSubfolders.find(
          (f) => f.name === sourceFolderName && f.id !== sourceId
        );

        if (existingFolder) {
          fileOps.setConflictName(sourceFolderName);
          fileOps.setConflictType('folder');
          if (existingFolder.id === sourceMeta.parentId) {
            fileOps.setConflictPendingActionWithoutOverwrite({
              rename: async () => {
                let counter = 1;
                let newName = `${sourceFolderName} (${counter})`;
                while (targetSubfolders.some((f) => f.name === newName)) {
                  counter++;
                  newName = `${sourceFolderName} (${counter})`;
                }

                await api.renameFolder(sourceId, newName);
                await api.moveFolder(
                  sourceId,
                  targetFolderId === 'root' ? undefined : targetFolderId
                );
                setItems((prev) => prev.filter((i) => i.id !== sourceId));
                await refresh();
                fileOps.showSnack(
                  t('documentManagement.snack.moved', 'Moved'),
                  'success'
                );
              },
            });
            fileOps.setConflictDialogWithoutOverwriteOpen(true);
          } else {
            fileOps.setConflictPendingAction({
              overwrite: async () => {
                await api.deleteFolder(existingFolder.id);
                await api.moveFolder(
                  sourceId,
                  targetFolderId === 'root' ? undefined : targetFolderId
                );
                setItems((prev) => prev.filter((i) => i.id !== sourceId));
                await refresh();
                fileOps.showSnack(
                  t('documentManagement.snack.moved', 'Moved'),
                  'success'
                );
              },
              rename: async () => {
                let counter = 1;
                let newName = `${sourceFolderName} (${counter})`;
                while (targetSubfolders.some((f) => f.name === newName)) {
                  counter++;
                  newName = `${sourceFolderName} (${counter})`;
                }

                await api.renameFolder(sourceId, newName);
                await api.moveFolder(
                  sourceId,
                  targetFolderId === 'root' ? undefined : targetFolderId
                );
                setItems((prev) => prev.filter((i) => i.id !== sourceId));
                await refresh();
                fileOps.showSnack(
                  t('documentManagement.snack.moved', 'Moved'),
                  'success'
                );
              },
            });
            fileOps.setConflictDialogOpen(true);
          }

          fileOps.setMoveChooserOpen(false);
          fileOps.setMoveSourceId(null);
          return;
        }

        await api.moveFolder(
          sourceId,
          targetFolderId === 'root' ? undefined : targetFolderId
        );
      } else {
        // Document move logic
        // Note: getDocumentMetadata is optional, so we skip parent check if not available
        if (api.getDocumentMetadata) {
          try {
            const docData = await api.getDocumentMetadata(sourceId);
            const docParent = docData?.folderId ?? 'root';
            if (docParent === targetFolderId) {
              fileOps.showSnack(
                t(
                  'documentManagement.snack.alreadyInFolderDocument',
                  'Cannot move document: it is already in the selected folder.'
                ),
                'error'
              );
              return;
            }
          } catch {
            // ignore
          }
        }

        const targetFolderData = (await api.getFolder(
          targetFolderId
        )) as FolderResponse;
        const targetDocuments = targetFolderData.documents || [];
        const sourceDoc = items.find((i) => i.id === sourceId);
        const sourceDocName = sourceDoc?.name ?? '';
        const existingDoc = targetDocuments.find(
          (d) => d.name === sourceDocName && d.id !== sourceId
        );

        if (existingDoc) {
          fileOps.setConflictName(sourceDocName);
          fileOps.setConflictType('file');
          fileOps.setConflictPendingAction({
            overwrite: async () => {
              await api.deleteDocument(existingDoc.id);
              await api.moveDocument(sourceId, targetFolderId);
              setItems((prev) => prev.filter((i) => i.id !== sourceId));
              await refresh();
              fileOps.showSnack(
                t('documentManagement.snack.moved', 'Moved'),
                'success'
              );
            },
            rename: async () => {
              let counter = 1;
              const lastDotIndex = sourceDocName.lastIndexOf('.');
              const baseName =
                lastDotIndex > 0
                  ? sourceDocName.substring(0, lastDotIndex)
                  : sourceDocName;
              const extension =
                lastDotIndex > 0 ? sourceDocName.substring(lastDotIndex) : '';

              let newName = `${baseName} (${counter})${extension}`;
              while (targetDocuments.some((d) => d.name === newName)) {
                counter++;
                newName = `${baseName} (${counter})${extension}`;
              }

              await api.renameDocument(sourceId, newName);
              await api.moveDocument(sourceId, targetFolderId);
              setItems((prev) => prev.filter((i) => i.id !== sourceId));
              await refresh();
              fileOps.showSnack(
                t('documentManagement.snack.moved', 'Moved'),
                'success'
              );
            },
          });
          fileOps.setConflictDialogOpen(true);
          fileOps.setMoveChooserOpen(false);
          fileOps.setMoveSourceId(null);
          return;
        }

        await api.moveDocument(sourceId, targetFolderId);
      }

      setItems((prev) => prev.filter((i) => i.id !== sourceId));
      fileOps.showSnack(
        t('documentManagement.snack.moved', 'Moved'),
        'success'
      );
    } catch {
      fileOps.showSnack(
        t('documentManagement.snack.moveFailed', 'Move failed'),
        'error'
      );
    }

    fileOps.setMoveChooserOpen(false);
    fileOps.setMoveSourceId(null);
  };

  const handleMoveRef = React.useRef(handleMove);
  React.useEffect(() => {
    handleMoveRef.current = handleMove;
  });

  // Event listeners for drag-and-drop
  React.useEffect(() => {
    const onRequestMove = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string; itemType?: Item['itemType'] }>;
      const id = ce?.detail?.id as string | undefined;
      const itemType = ce?.detail?.itemType;

      if (id) {
        fileOps.setMoveSourceId(id);

        if (itemType) {
          fileOps.setMoveSourceType(itemType);
        } else {
          // Fallback: try to find the item in current items
          const found = itemsRef.current.find((x) => x.id === id);
          if (found) {
            fileOps.setMoveSourceType(found.itemType);
          } else {
            fileOps.setMoveSourceType('document');
          }
        }

        fileOps.setMoveChooserOpen(true);
      }
    };

    const onDropOnBreadcrumb = (e: Event) => {
      const ce = e as CustomEvent<{ item: DmsDragPayload; targetId?: string }>;
      const detail = ce?.detail;
      if (!detail) return;
      const { item, targetId } = detail;
      if (item && targetId)
        handleMoveRef.current?.(item.id, item.type, targetId);
    };

    document.addEventListener(
      'dms:request-move',
      onRequestMove as EventListener
    );
    document.addEventListener(
      'dms:drop-on-breadcrumb',
      onDropOnBreadcrumb as EventListener
    );
    return () => {
      document.removeEventListener(
        'dms:request-move',
        onRequestMove as EventListener
      );
      document.removeEventListener(
        'dms:drop-on-breadcrumb',
        onDropOnBreadcrumb as EventListener
      );
    };
  }, []);

  // Handle drag & drop on file items
  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = e.dataTransfer.getData('application/x-dms-item');
      if (!data) return;
      const parsed = JSON.parse(data);
      if (parsed && parsed.id && parsed.type) {
        handleMove(parsed.id, parsed.type, targetId);
      }
    } catch {
      // ignore
    }
  };

  return (
    <Box
      role="region"
      aria-label={t('documentManagement.fileExplorer', 'Document Explorer')}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <FileExplorerToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onUploadClick={() => fileOps.setUploadOpen(true)}
        onDownloadClick={() => download.setDownloadDialogOpen(true)}
        onCreateFolderClick={createFolder.handleOpenNewFolderDialog}
        canUpload={canAccess('uploadDocuments')}
        canManage={canAccess('manageDocuments')}
        availableTags={tagsHook.tags}
        selectedTags={selectedTags}
        onTagFilterChange={setSelectedTags}
        onRefetchTags={tagsHook.fetchTags}
      />

      <BreadcrumbBar path={currentPath} onNavigate={handleNavigatePath} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ width: '100%' }} role="list">
          {filteredItems.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
            >
              {t('documentManagement.noItems', 'No items found')}
            </Typography>
          ) : (
            filteredItems.map((item) => (
              <FileListItem
                key={item.id}
                item={item}
                onRename={fileOps.handleOpenRename}
                onDelete={fileOps.handleOpenDelete}
                onDownload={download.handleDownload}
                onOpen={handleOpenFolder}
                onPreview={preview.handleConvertOfficeToPdf}
                onManageGroups={
                  item.itemType === 'folder'
                    ? () => handleOpenManageGroups(item.id)
                    : undefined
                }
                onManageTags={
                  item.itemType !== 'folder'
                    ? () => handleOpenTagEditor(item.id)
                    : undefined
                }
                onDrop={
                  item.itemType === 'folder'
                    ? (e) => handleFileDrop(e, item.id)
                    : undefined
                }
                onDragOver={
                  item.itemType === 'folder'
                    ? (e) => e.preventDefault()
                    : undefined
                }
              />
            ))
          )}
        </List>
      </Box>

      {/* All dialogs */}
      <RenameDialog
        open={fileOps.renameOpen}
        value={fileOps.renameValue}
        onValueChange={fileOps.setRenameValue}
        onClose={() => fileOps.setRenameOpen(false)}
        onConfirm={fileOps.handleRename}
      />

      <DeleteConfirmDialog
        open={fileOps.deleteConfirmOpen}
        onClose={() => fileOps.setDeleteConfirmOpen(false)}
        onConfirm={fileOps.handleDelete}
      />

      <DeleteFolderConfirmDialog
        open={fileOps.deleteFolderConfirmOpen}
        onClose={() => fileOps.setDeleteFolderConfirmOpen(false)}
        onConfirm={fileOps.handleDeleteFolderConfirmed}
      />

      <NewFolderDialog
        open={createFolder.newFolderOpen}
        folderName={createFolder.newFolderName}
        studyGroups={createFolder.newFolderStudyGroups}
        onFolderNameChange={createFolder.setNewFolderName}
        onStudyGroupsChange={createFolder.setNewFolderStudyGroups}
        onClose={createFolder.handleCloseNewFolderDialog}
        onConfirm={createFolder.handleCreateFolder}
        availableGroups={studyGroupsHook.studyGroups}
        studyGroupsLoading={studyGroupsHook.studyGroupsLoading}
        studyGroupsError={studyGroupsHook.studyGroupsError}
        parentFolderGroups={createFolder.manageGroupsParentGroups}
      />

      <UploadDialog
        open={fileOps.uploadOpen}
        selectedFiles={fileOps.selectedFiles}
        fileInputRef={fileOps.fileInputRef}
        onFileSelection={(files) =>
          fileOps.setSelectedFiles((prev) => [...prev, ...files])
        }
        onRemoveFile={fileOps.handleRemoveSelectedFile}
        onClose={fileOps.handleCloseUpload}
        onConfirm={fileOps.handleUploadDocument}
      />

      <DownloadDialog
        open={download.downloadDialogOpen}
        onClose={() => download.setDownloadDialogOpen(false)}
        items={items}
        onConfirm={download.handleDownloadSelected}
      />

      <ConflictDialog
        open={fileOps.conflictDialogOpen}
        conflictName={fileOps.conflictName}
        conflictType={fileOps.conflictType}
        onAction={fileOps.handleConflictAction}
      />

      <ConflictDialogWithoutOverwrite
        open={fileOps.conflictDialogWithoutOverwriteOpen}
        conflictName={fileOps.conflictName}
        conflictType={fileOps.conflictType}
        onAction={fileOps.handleConflictActionWithoutOverwrite}
      />

      <MoveDialog
        open={fileOps.moveChooserOpen}
        onClose={() => fileOps.setMoveChooserOpen(false)}
        onMove={(targetFolderId: string) => {
          if (fileOps.moveSourceId && fileOps.moveSourceType) {
            handleMove(
              fileOps.moveSourceId,
              fileOps.moveSourceType,
              targetFolderId
            );
          }
        }}
        currentFolderId={currentFolderIdRef.current}
        currentPath={currentPath}
        api={api}
        moveSourceId={fileOps.moveSourceId}
      />

      <ManageStudyGroupsDialog
        open={studyGroupsHook.manageGroupsDialogOpen}
        onClose={studyGroupsHook.closeManageGroupsDialog}
        onSave={handleSaveStudyGroups}
        folderName={studyGroupsHook.manageGroupsFolderName}
        currentGroups={studyGroupsHook.manageGroupsCurrentGroups}
        availableGroups={studyGroupsHook.studyGroups}
        loading={studyGroupsHook.studyGroupsLoading}
        error={studyGroupsHook.studyGroupsError}
        parentFolderGroups={studyGroupsHook.manageGroupsParentGroups}
      />

      <TagEditor
        open={tagEditorOpen}
        onClose={() => setTagEditorOpen(false)}
        documentId={tagEditorDocumentId}
        documentName={tagEditorDocumentName}
        currentTags={tagEditorCurrentTags}
        onSave={handleSaveTags}
      />

      <FileViewer
        open={preview.viewerOpen}
        onClose={preview.handleCloseViewer}
        fileId={preview.viewerFile?.id}
        fileUrl={preview.viewerFile?.url ?? null}
        fileName={preview.viewerFile?.name ?? null}
        fileType={preview.viewerFile?.type ?? null}
        loading={preview.viewerLoading}
        setLoading={preview.setViewerLoading}
      />

      <Snackbar
        open={fileOps.snack.open}
        autoHideDuration={3000}
        onClose={() => fileOps.setSnack({ ...fileOps.snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => fileOps.setSnack({ ...fileOps.snack, open: false })}
          severity={fileOps.snack.severity}
          sx={{ width: '100%' }}
        >
          {fileOps.snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
