import * as React from 'react';
import {
  Box,
  Typography,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { parseFolderMetadata } from './folderMetadata';
import FileListItem from './FileListItem';
import FileViewer from './FileViewer';
import BreadcrumbBar from './BreadcrumbBar';
import DownloadDialog from './DownloadDialog';
import type { DmsDragPayload } from '../../lib/dmsEvents';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import Button from '@shared-components/Button/Button';

type Item = {
  id: string;
  name: string;
  size: number; // bytes
  uploadDate: string; // ISO
  itemType: 'folder' | 'document' | 'pdf' | 'other';
};

type FolderResponse = {
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
  }>;
  path?: Array<{ id: string; name: string }>;
};

type DocForZip = {
  url: string;
  name: string;
  path: string;
};

// Maximum folder depth to walk when building breadcrumb paths.
const MAX_PATH_DEPTH = 50;
const MAX_FILE_SIZE_MB = 5;

export default function FileExplorer(): JSX.Element {
  const { t } = useTranslation();
  const api = useDmsApiSelector();
  const [items, setItems] = React.useState<Item[]>([]);
  const currentFolderIdRef = React.useRef<string>('root');
  const [currentPath, setCurrentPath] = React.useState<
    Array<{ id: string; name: string }>
  >([{ id: 'root', name: t('documentManagement.root', 'Home') }]);
  const currentFolderName =
    (currentPath.length > 0
      ? currentPath[currentPath.length - 1].name
      : 'documents') || 'documents';
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteFolderConfirmOpen, setDeleteFolderConfirmOpen] =
    React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerFile, setViewerFile] = React.useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [snack, setSnack] = React.useState<{
    open: boolean;
    msg?: string | null;
    severity: 'success' | 'error';
  }>({ open: false, msg: null, severity: 'success' });
  const [moveChooserOpen, setMoveChooserOpen] = React.useState(false);
  const [moveSourceId, setMoveSourceId] = React.useState<string | null>(null);
  const [moveSourceType, setMoveSourceType] = React.useState<
    Item['itemType'] | string | null
  >(null);
  // keep a ref to the latest items so event handlers don't need to be
  // re-registered whenever `items` changes.
  const itemsRef = React.useRef<Item[]>(items);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // We'll also keep a ref for `handleMove` so breadcrumb-drop handlers can
  // invoke it without the listener needing to be re-registered.
  const handleMoveRef = React.useRef<
    | ((
        sourceId: string,
        sourceType: Item['itemType'] | string,
        targetId: string
      ) => Promise<void>)
    | null
  >(null);

  // handle DOM custom events from FileItemActions or breadcrumb drops.
  // Register listeners once and read the latest values via refs.
  React.useEffect(() => {
    const onRequestMove = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string }>;
      const id = ce?.detail?.id as string | undefined;
      if (id) {
        setMoveSourceId(id);
        const found = itemsRef.current.find((x) => x.id === id);
        setMoveSourceType(found?.itemType ?? 'document');
        setMoveChooserOpen(true);
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
    // empty deps so listeners are registered once on mount
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      const folder = (await api.getFolder(
        currentFolderIdRef.current
      )) as FolderResponse;
      const docs: Item[] = (folder.documents || []).map((d) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        uploadDate: d.createdDate ?? new Date().toISOString(),
        itemType: d.type === 'application/pdf' ? 'pdf' : 'document',
      }));
      const subfolders: Item[] = (folder.subfolders || []).map((f) => ({
        id: f.id,
        name: f.name,
        size: 0,
        uploadDate: f.createdDate ?? new Date().toISOString(),
        itemType: 'folder',
      }));
      setItems([...subfolders, ...docs]);
    } catch {
      // ignore for now
    }
  }, [api]);

  const buildPathFromId = React.useCallback(
    async (id: string) => {
      try {
        if (!id || id === 'root') {
          setCurrentPath([
            { id: 'root', name: t('documentManagement.root', 'Home') },
          ]);
          return;
        }
        const path: Array<{ id: string; name: string }> = [];
        let currentId: string | undefined = id;
        const iterationLimit = MAX_PATH_DEPTH;
        let iteration = 0;
        while (currentId && iteration < iterationLimit) {
          const folderData = (await api.getFolder(currentId)) as FolderResponse;
          const md = parseFolderMetadata(folderData, currentId);
          path.push({ id: md.id, name: md.name });
          if (!md.parentId || md.parentId === 'root') break;
          currentId = md.parentId;
          iteration += 1;
        }
        const root = { id: 'root', name: t('documentManagement.root', 'Home') };
        const reversed = path.reverse();
        setCurrentPath([root, ...reversed]);
      } catch {
        // fallback
      }
    },
    [api, t]
  );

  const handleClose = () => {
    setActiveId(null);
  };

  // keep handleMoveRef up to date so event handlers call the latest function
  // (updated after handleMove is declared further below)

  const getItemById = (id?: string | null) =>
    items.find((i) => i.id === (id ?? ''));

  const showSnack = (
    msg: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setSnack({ open: true, msg, severity });
  };

  const handleOpenRename = (id: string) => {
    setActiveId(id);
    const it = getItemById(id);
    setRenameValue(it?.name ?? '');
    setRenameOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setActiveId(id);
    const it = getItemById(id);
    if (it?.itemType === 'folder') {
      setDeleteFolderConfirmOpen(true);
    } else {
      setDeleteConfirmOpen(true);
    }
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
          await api.renameFolder(it.id, newName);
        } else {
          await api.renameDocument(it.id, newName);
        }
        showSnack(t('documentManagement.snack.renamed', 'Renamed'), 'success');
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

  const handleOpenViewer = async (docId: string) => {
    // console.log("handleOpenViewer called with:", docId)
    try {
      const { url, name, type } = await api.downloadDocument(docId);
      const doc = items.find((i) => i.id === docId);
      if (!doc) return;

      setViewerFile({ url, name, type });
      setViewerOpen(true);
    } catch {
      showSnack(
        t('documentManagement.snack.previewFailed', 'Preview failed'),
        'error'
      );
    }
  };

  const handleCloseViewer = () => {
    setViewerFile(null);
    setViewerOpen(false);
  };

  const handleUploadDocument = async () => {
    // check if files are present
    if (selectedFiles.length === 0) {
      showSnack(
        t('documentManagement.snack.noFiles', 'No files selected'),
        'error'
      );
      return;
    }

    // check max file size
    const tooBig = selectedFiles.find(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
    );
    if (tooBig) {
      handleCloseUpload();
      showSnack(
        t('documentManagement.snack.fileTooLarge', 'File exceeds max size'),
        'error'
      );
      return;
    }

    // check duplicates
    const duplicate = selectedFiles.find((file) =>
      items.some((item) => item.name === file.name)
    );
    if (duplicate) {
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showSnack(
        t('documentManagement.snack.duplicate', {
          defaultValue: 'File {{duplicateName}} already existing',
          duplicateName: duplicate.name,
        }),
        'error'
      );
      return;
    }

    try {
      for (const file of selectedFiles) {
        await api.uploadDocument(file, currentFolderIdRef.current);
        await refresh();
      }
      showSnack(
        t('documentManagement.snack.uploaded', 'Uploaded successfully'),
        'success'
      );
    } catch {
      showSnack(
        t('documentManagement.snack.uploadFailed', 'Upload failed'),
        'error'
      );
    }

    // reset and close
    setUploadOpen(false);
    setSelectedFiles([]);
  };

  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const doc = items.find((i) => i.id === docId);
      if (!doc) return;

      if (doc.itemType === 'document') {
        const { url, name } = await api.downloadDocument(docId);

        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();

        showSnack(
          t('documentManagement.snack.downloaded', 'Download started'),
          'success'
        );
      } else if (doc.itemType === 'folder') {
        const docsForZip = await collectDocsFromFolderWithPaths(
          doc.id,
          doc.name
        );

        if (docsForZip.length === 0) {
          showSnack(
            t(
              'documentManagement.snack.noDocsInSelection',
              'No documents in folder'
            ),
            'error'
          );
        }

        await api.downloadAsZip(docsForZip, doc.name);

        showSnack(
          t('documentManagement.snack.downloaded', 'Download started'),
          'success'
        );
      }
    } catch {
      showSnack(
        t('documentManagement.snack.downloadFailed', 'Download failed'),
        'error'
      );
    }
  };

  const hasAnyDownloadableDocs = React.useCallback(
    () => items.length > 0,
    [items]
  );

  const isDoc = (i: Item) => i.itemType === 'document' || i.itemType === 'pdf';

  const collectDocsFromFolderWithPaths = async (
    folderId: string,
    prefix: string
  ): Promise<DocForZip[]> => {
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
      const inside = await collectDocsFromFolderWithPaths(sf.id, childPrefix);
      nested.push(...inside);
    }
    return [...docsHere, ...nested];
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return setNewFolderOpen(false);
    try {
      const created = await api.createFolder(name, currentFolderIdRef.current);
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
  };

  const handleOpenFolder = async (id: string) => {
    try {
      currentFolderIdRef.current = id;
      await buildPathFromId(id);
      refresh();
    } catch {
      currentFolderIdRef.current = id;
      setCurrentPath((p) => [...p, { id, name: 'Folder' }]);
      refresh();
    }
  };

  const handleMove = async (
    sourceId: string,
    sourceType: Item['itemType'] | string,
    targetFolderId: string
  ) => {
    // Prevent moving into same folder (noop)
    if (!sourceId || !targetFolderId) return;
    // Helper: determine whether `targetId` is a descendant of `sourceId`.
    const isDescendant = async (targetId: string, sourceIdCheck: string) => {
      try {
        let current: string | undefined = targetId;
        let depth = 0;
        while (current && depth < MAX_PATH_DEPTH) {
          if (current === sourceIdCheck) return true;
          // when at root stop
          if (current === 'root') break;
          const folderData = (await api.getFolder(current)) as FolderResponse;
          const md = parseFolderMetadata(folderData, current);
          if (!md.parentId) break;
          current = md.parentId;
          depth += 1;
        }
        return false;
      } catch {
        // on error, be conservative and disallow
        return true;
      }
    };
    try {
      if (sourceType === 'folder') {
        // disallow moving a folder into itself or into its descendant
        if (sourceId === targetFolderId) {
          showSnack(
            t(
              'documentManagement.snack.invalidMove',
              'Cannot move a folder into itself or its descendant.'
            ),
            'error'
          );
          return;
        }
        // if the folder is already directly inside the target, noop
        try {
          const srcFolderData = (await api.getFolder(
            sourceId
          )) as FolderResponse;
          const srcMeta = parseFolderMetadata(srcFolderData, sourceId);
          const srcParent = srcMeta.parentId ?? 'root';
          if (srcParent === targetFolderId) {
            showSnack(
              t(
                'documentManagement.snack.alreadyInFolderFolder',
                'Cannot move folder: it is already in the selected folder.'
              ),
              'error'
            );
            return;
          }
        } catch {
          // ignore errors here and fall back to descendant-check below
        }

        const bad = await isDescendant(targetFolderId, sourceId);
        if (bad) {
          showSnack(
            t(
              'documentManagement.snack.invalidMove',
              'Cannot move a folder into itself or its descendant.'
            ),
            'error'
          );
          return;
        }
        await api.moveFolder(
          sourceId,
          targetFolderId === 'root' ? undefined : targetFolderId
        );
      } else {
        // For documents, avoid a no-op move if it's already in the target folder.
        try {
          // If the document is visible in the current listing, its parent is currentFolderIdRef.current.
          const inCurrent = items.find((it) => it.id === sourceId);
          if (inCurrent && currentFolderIdRef.current === targetFolderId) {
            showSnack(
              t(
                'documentManagement.snack.alreadyInFolderFile',
                'Cannot move file: it is already in the selected folder.'
              ),
              'error'
            );
            return;
          }

          // Otherwise, check the current path folders (cheap limited scan) to find the doc.
          for (const p of currentPath) {
            try {
              const folderData = (await api.getFolder(p.id)) as FolderResponse;
              const docs = folderData.documents || [];
              if (docs.find((d) => d.id === sourceId)) {
                if (p.id === targetFolderId) {
                  showSnack(
                    t(
                      'documentManagement.snack.alreadyInFolderFile',
                      'Cannot move file: it is already in the selected folder.'
                    ),
                    'error'
                  );
                  return;
                }
                break;
              }
            } catch {
              // ignore and continue
            }
          }
        } catch {
          // ignore fallback errors
        }

        await api.moveDocument(
          sourceId,
          targetFolderId === 'root' ? undefined : targetFolderId
        );
      }
      // remove moved item from current listing if it left current folder
      setItems((prev) => prev.filter((i) => i.id !== sourceId));
      showSnack(t('documentManagement.snack.moved', 'Moved'), 'success');
    } catch {
      showSnack(
        t('documentManagement.snack.moveFailed', 'Move failed'),
        'error'
      );
    }
    setMoveChooserOpen(false);
    setMoveSourceId(null);
  };

  // keep handleMoveRef up to date so event handlers call the latest function
  React.useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  // Provide per-row drop handler by cloning items into a wrapper that accepts drops

  const handleNavigatePath = (id: string) => {
    setCurrentPath((p) => {
      const idx = p.findIndex((x) => x.id === id);
      if (idx === -1) return p;
      const newPath = p.slice(0, idx + 1);
      currentFolderIdRef.current = id;
      refresh();
      return newPath;
    });
  };

  React.useEffect(() => {
    // Run once on mount. navigation and folder changes explicitly call refresh/buildPathFromId.
    (async () => {
      await refresh();
      await buildPathFromId(currentFolderIdRef.current);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      role="region"
      aria-labelledby="file-explorer-title"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Typography id="file-explorer-title" sx={{ mb: 2 }} variant="h6">
        {t('documentManagement.files', 'Files')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <BreadcrumbBar path={currentPath} onNavigate={handleNavigatePath} />
        <Box sx={{ flex: 1 }} />
        <IconButton
          aria-label={t('documentManagement.newFolder.title', 'Create folder')}
          title={t('documentManagement.newFolder.title', 'Create folder')}
          onClick={() => setNewFolderOpen(true)}
        >
          <CreateNewFolderIcon fontSize="small" aria-hidden />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          aria-label={t(
            'documentManagement.uploadDocuemnt.button',
            'Upload document'
          )}
          aria-describedby={t(
            'documentManagement.uploadDocument.maxSize',
            'Max size of a file: X MB'
          )}
          variant="solid"
          sx={{
            backgroundColor: '#2f3b52',
            color: '#fff',
            '&:hover': { backgroundColor: '#47566eff' },
            flex: 1,
          }}
          onClick={() => setUploadOpen(true)}
        >
          {t('documentManagement.uploadDocument.button', 'Upload document')}
        </Button>
        <Button
          aria-label={t(
            'documentManagement.downloadDocument.button',
            'Download documents'
          )}
          aria-describedby={t(
            'documentManagement.downloadDocument.description',
            'Downloads every document in current directory'
          )}
          variant="solid"
          sx={{
            backgroundColor: '#2f3b52',
            color: '#fff',
            '&:hover': { backgroundColor: '#47566eff' },
            flex: 1,
          }}
          onClick={() => {
            if (!hasAnyDownloadableDocs()) {
              showSnack(
                t(
                  'documentManagement.snack.noDocsInFolder',
                  'No documents or folders in current directory'
                ),
                'error'
              );
              return;
            }
            setDownloadDialogOpen(true);
          }}
        >
          {t('documentManagement.downloadDocument.button', 'Download documents')}
        </Button>
      </Box>
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          minHeight: 0,
          maxHeight: '500px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}
      >
        <List aria-label="file list" sx={{ padding: 0 }}>
          {items.map((item) => (
            <FileListItem
              key={item.id}
              item={item}
              onRename={handleOpenRename}
              onDelete={handleOpenDelete}
              onOpen={handleOpenFolder}
              onDownload={handleDownload}
              onPreview={
                item.itemType !== 'folder' ? handleOpenViewer : undefined
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                try {
                  const raw = e.dataTransfer?.getData('application/x-dms-item');
                  if (!raw) return;
                  const parsed = JSON.parse(raw);
                  // If dropped onto a folder, move into that folder
                  if (item.itemType === 'folder') {
                    handleMove(parsed.id, parsed.type, item.id);
                  }
                } catch {
                  // ignore
                }
              }}
            />
          ))}
        </List>
      </Box>

      {/* File viewer dialog */}
      <FileViewer
        open={viewerOpen}
        onClose={handleCloseViewer}
        fileUrl={viewerFile?.url ?? null}
        fileName={viewerFile?.name ?? null}
        fileType={viewerFile?.type ?? null}
      />
      {/* Move chooser dialog (keyboard fallback). Simple: pick one of the current breadcrumb entries as destination */}
      <Dialog
        open={Boolean(moveChooserOpen && moveSourceId)}
        onClose={() => {
          setMoveChooserOpen(false);
          setMoveSourceId(null);
        }}
        aria-labelledby="move-dialog-title"
      >
        <DialogTitle id="move-dialog-title">
          {t('documentManagement.moveDialog.title', 'Move item')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t(
              'documentManagement.moveDialog.select',
              'Select destination folder from the current path'
            )}
          </Typography>
          {currentPath.map((p) => (
            <Box key={p.id} sx={{ mb: 1 }}>
              <Button
                variant="soft"
                onClick={() =>
                  moveSourceId &&
                  handleMove(moveSourceId, moveSourceType ?? 'document', p.id)
                }
              >
                {p.name}
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setMoveChooserOpen(false);
              setMoveSourceId(null);
            }}
          >
            {t('documentManagement.moveDialog.cancel', 'Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        aria-labelledby="rename-title"
      >
        <DialogTitle id="rename-title">
          {t('documentManagement.renameDialog.title', 'Rename')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('documentManagement.renameDialog.label', 'New name')}
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)} variant="solid">
            {t('documentManagement.renameDialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleRename} variant="solid">
            {t('documentManagement.renameDialog.confirm', 'Rename')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-confirm-title"
      >
        <DialogTitle id="delete-confirm-title">
          {t('documentManagement.deleteDialog.title', 'Delete')}
        </DialogTitle>
        <DialogContent>
          {t(
            'documentManagement.deleteDialog.message',
            'Are you sure you want to delete this item?'
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="solid">
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleDelete} variant="solid" color="danger">
            {t('documentManagement.deleteDialog.confirm', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Folder delete confirmation */}
      <Dialog
        open={deleteFolderConfirmOpen}
        onClose={() => setDeleteFolderConfirmOpen(false)}
        aria-labelledby="delete-folder-confirm-title"
      >
        <DialogTitle id="delete-folder-confirm-title">
          {t('documentManagement.deleteFolderDialog.title', 'Delete folder')}
        </DialogTitle>
        <DialogContent>
          {t(
            'documentManagement.deleteFolderDialog.message',
            'Deleting this folder will also delete all contained documents. This action cannot be undone.'
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteFolderConfirmOpen(false)}
            variant="solid"
          >
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleDeleteFolderConfirmed}
            variant="solid"
            color="danger"
          >
            {t('documentManagement.deleteDialog.confirm', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New folder dialog */}
      <Dialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        aria-labelledby="new-folder-title"
      >
        <DialogTitle id="new-folder-title">
          {t('documentManagement.newFolder.title', 'Create folder')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('documentManagement.newFolder.label', 'Folder name')}
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderOpen(false)} variant="solid">
            {t('documentManagement.newFolder.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleCreateFolder} variant="solid">
            {t('documentManagement.newFolder.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload document dialog */}
      <Dialog
        open={uploadOpen}
        onClose={handleCloseUpload}
        aria-labelledby="upload-dialog-title"
      >
        <DialogTitle id="upload-dialog-title">
          {t('documentManagement.uploadDocument.title', 'Upload document')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('documentManagement.uploadDocument.maxSize', {
              defaultValue: 'Maximal {{max}} MB per file',
              max: MAX_FILE_SIZE_MB,
            })}
          </Typography>
          <input
            id="file-input"
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setSelectedFiles(files);
            }}
          />
          <label htmlFor="file-input">
            <Button component="span" variant="soft">
              {t(
                'documentManagement.uploadDocument.selectFiles',
                'Select files:'
              )}
            </Button>
          </label>

          {/* Show selected files */}
          {selectedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {t(
                  'documentMangement.uploadDocument.selected',
                  'Selected files:'
                )}
              </Typography>
              <ul>
                {selectedFiles.map((file) => (
                  <li key={file.name}>
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDocument} variant="solid">
            {t('documentManagement.uploadDocument.confirm', 'upload')}
          </Button>
          <Button onClick={handleCloseUpload} variant="solid">
            {t('documentManagement.uploadDocument.cancel', 'Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Download dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        items={items}
        onConfirm={async (selectedIds) => {
          try {
            if (!selectedIds || selectedIds.length === 0) {
              showSnack(
                t('documentManagement.snack.noSelecttion', 'No Selection'),
                'error'
              );
              return;
            }

            const idSet = new Set(selectedIds);
            const selectedItems = items.filter((i) => idSet.has(i.id));

            const docsForZip: DocForZip[] = [];

            for (const item of selectedItems) {
              if (isDoc(item)) {
                const { url, name } = await api.downloadDocument(item.id);
                docsForZip.push({ url, name, path: '' });
              } else if (item.itemType === 'folder') {
                const nested = await collectDocsFromFolderWithPaths(
                  item.id,
                  item.name
                );
                docsForZip.push(...nested);
              }
            }

            if (docsForZip.length === 0) {
              showSnack(
                t(
                  'documentManagement.snack.noDocsInSelection',
                  'No documents in selection'
                ),
                'error'
              );
              return;
            }

            if (docsForZip.length === 1) {
              const { url, name } = docsForZip[0];
              const a = document.createElement('a');
              a.href = url;
              a.download = name;
              a.click();
              showSnack(
                t('documentManagement.snack.downloaded', 'Download started'),
                'success'
              );
              setDownloadDialogOpen(false);
              return;
            } else {
              await api.downloadAsZip(docsForZip, currentFolderName);
              showSnack(
                t('documentManagement.snack.downloaded', 'Download started'),
                'success'
              );
              setDownloadDialogOpen(false);
            }
          } catch {
            showSnack(
              t('documentManagement.snack.downloadFailed', 'Download failed'),
              'error'
            );
          }
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
