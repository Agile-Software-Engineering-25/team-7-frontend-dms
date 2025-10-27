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
  InputAdornment,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { parseFolderMetadata } from './folderMetadata';
import FileListItem from './FileListItem';
import FileViewer from './FileViewer';
import BreadcrumbBar from './BreadcrumbBar';
import DownloadDialog from './DownloadDialog';
import MoveDialog from './MoveDialog';
import type { DmsDragPayload } from '../../lib/dmsEvents';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/FileDownload';
import Button from '@mui/joy/Button';

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

export default function FileExplorer(): React.ReactElement {
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
    severity: 'success' | 'error' | 'info';
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

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    // Filter valid files: not too big and not duplicates
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

    if (oversizedFiles.length > 0) {
      for (const file of oversizedFiles) {
        messages.push({
          msg: t('documentManagement.snack.fileTooLarge', {
            defaultValue:
              'File {{fileName}} exceeds max size of {{maxSize}} MB',
            fileName: file.name,
            maxSize: MAX_FILE_SIZE_MB,
          }),
          severity: 'error',
        });
      }
    }

    if (duplicateFiles.length > 0) {
      for (const file of duplicateFiles) {
        messages.push({
          msg: t('documentManagement.snack.duplicate', {
            defaultValue: 'File {{duplicateName}} already exists',
            duplicateName: file.name,
          }),
          severity: 'error',
        });
      }
    }

    if (validFiles.length === 0) {
      if (messages.length > 0) {
        await showSnackSequence(messages);
      }
      handleCloseUpload();
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
          ? 'Uploaded partially. Failed for: {{fileNames}}'
          : 'Upload failed for: {{fileNames}}';
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
        // ensure success info appears before errors so the final message stays an error
        messages.unshift({ msg: successMessage, severity: 'success' });
      }
    }

    if (messages.length > 0) {
      await showSnackSequence(messages);
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

      if (doc.itemType === 'document' || doc.itemType === 'pdf') {
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
      aria-label={t(
        'documentManagement.fileExplorerRegion',
        'Document explorer'
      )}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <TextField
          size="small"
          placeholder={t(
            'documentManagement.searchPlaceholder',
            'Suche (in Kürze verfügbar)'
          )}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#002E6D' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: '100%', md: 240 },
            maxWidth: { xs: '100%', md: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              backgroundColor: '#ffffff',
              '& fieldset': { borderColor: '#d1d9e6' },
              '&:hover fieldset': { borderColor: '#002E6D' },
              '&.Mui-focused fieldset': { borderColor: '#002E6D' },
            },
          }}
        />
        <Button
          size="sm"
          variant="outlined"
          startDecorator={<FilterListIcon fontSize="small" />}
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
            '--Button-borderWidth': '1px',
            '--Button-color': '#002E6D',
            '--Button-borderColor': '#002E6D',
            '--Button-hoverBg': 'rgba(0, 46, 109, 0.08)',
            '--Button-hoverBorderColor': '#001f56',
            '--Button-activeBg': 'rgba(0, 46, 109, 0.12)',
            fontWeight: 600,
          }}
          onClick={() =>
            showSnack(
              t(
                'documentManagement.filterPlaceholder',
                'Filterfunktion folgt in Kürze'
              ),
              'info'
            )
          }
        >
          {t('documentManagement.filterButton', 'Filter (bald)')}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="sm"
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
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
            '--Button-minHeight': '34px',
            '--Button-paddingInline': '16px',
            '--Button-bg': '#002E6D',
            '--Button-color': '#ffffff',
            '--Button-hoverBg': '#001f56',
            '--Button-activeBg': '#001a4a',
            fontWeight: 600,
          }}
          onClick={() => setUploadOpen(true)}
          startDecorator={<UploadIcon fontSize="small" />}
        >
          {t('documentManagement.uploadDocument.button', 'Upload document')}
        </Button>
        <Button
          size="sm"
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
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
            '--Button-minHeight': '34px',
            '--Button-paddingInline': '16px',
            '--Button-bg': '#002E6D',
            '--Button-color': '#ffffff',
            '--Button-hoverBg': '#001f56',
            '--Button-activeBg': '#001a4a',
            fontWeight: 600,
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
          startDecorator={<DownloadIcon fontSize="small" />}
        >
          {t(
            'documentManagement.downloadDocument.button',
            'Download documents'
          )}
        </Button>
        <IconButton
          aria-label={t('documentManagement.newFolder.title', 'Create folder')}
          title={t('documentManagement.newFolder.title', 'Create folder')}
          onClick={() => setNewFolderOpen(true)}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#002E6D',
            color: '#ffffff',
            boxShadow: '0px 8px 18px rgba(0, 46, 109, 0.25)',
            '&:hover': {
              backgroundColor: '#001f56',
            },
          }}
        >
          <CreateNewFolderIcon fontSize="small" aria-hidden />
        </IconButton>
      </Box>
      <Box sx={{ mb: 2 }}>
        <BreadcrumbBar path={currentPath} onNavigate={handleNavigatePath} />
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          maxHeight: '500px',
          border: 'none',
          borderRadius: 0,
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
      {/* Enhanced Move Dialog with folder tree */}
      <MoveDialog
        open={Boolean(moveChooserOpen && moveSourceId)}
        onClose={() => {
          setMoveChooserOpen(false);
          setMoveSourceId(null);
        }}
        onMove={(targetFolderId: string) =>
          moveSourceId &&
          handleMove(moveSourceId, moveSourceType ?? 'document', targetFolderId)
        }
        currentFolderId={currentFolderIdRef.current}
        currentPath={currentPath}
        api={api}
        moveSourceId={moveSourceId}
      />

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRenameOpen(false)}
            variant="plain"
            color="primary"
            sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}
          >
            {t('documentManagement.renameDialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleRename}
            variant="solid"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
              '--Button-minHeight': '34px',
              '--Button-paddingInline': '16px',
              '--Button-bg': '#002E6D',
              '--Button-color': '#ffffff',
              '--Button-hoverBg': '#001f56',
              '--Button-activeBg': '#001a4a',
              fontWeight: 600,
            }}
          >
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
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="plain"
            color="primary"
            sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}
          >
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="solid"
            color="danger"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
              '--Button-minHeight': '34px',
              '--Button-paddingInline': '16px',
              '--Button-bg': '#002E6D',
              '--Button-color': '#ffffff',
              '--Button-hoverBg': '#001f56',
              '--Button-activeBg': '#001a4a',
              fontWeight: 600,
            }}
          >
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
            variant="plain"
            color="primary"
            sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}
          >
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleDeleteFolderConfirmed}
            variant="solid"
            color="danger"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
              '--Button-minHeight': '34px',
              '--Button-paddingInline': '16px',
              '--Button-bg': '#002E6D',
              '--Button-color': '#ffffff',
              '--Button-hoverBg': '#001f56',
              '--Button-activeBg': '#001a4a',
              fontWeight: 600,
            }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNewFolderOpen(false)}
            variant="plain"
            color="primary"
            sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}
          >
            {t('documentManagement.newFolder.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="solid"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
              '--Button-minHeight': '34px',
              '--Button-paddingInline': '16px',
              '--Button-bg': '#002E6D',
              '--Button-color': '#ffffff',
              '--Button-hoverBg': '#001f56',
              '--Button-activeBg': '#001a4a',
              fontWeight: 600,
            }}
          >
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
              setSelectedFiles((prev) => [...prev, ...files]);
            }}
          />
          <label htmlFor="file-input">
            <Button variant="soft" sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}>
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
          <Button
            onClick={handleUploadDocument}
            variant="solid"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
              '--Button-minHeight': '34px',
              '--Button-paddingInline': '16px',
              '--Button-bg': '#002E6D',
              '--Button-color': '#ffffff',
              '--Button-hoverBg': '#001f56',
              '--Button-activeBg': '#001a4a',
              fontWeight: 600,
            }}
          >
            {t('documentManagement.uploadDocument.confirm', 'upload')}
          </Button>
          <Button
            onClick={handleCloseUpload}
            variant="plain"
            color="primary"
            sx={{ '--Button-radius': '8px', '--Button-shadow': 'none', '--Button-hoverShadow': 'none' }}
          >
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
