import * as React from 'react';
import {
  Box,
  Typography,
  Button as MuiButton,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Card from '@shared-components/Card/Card';
import useDmsApi from '@hooks/useDmsApi';
// FileItemActions used by item components
import FileListItem from './FileListItem';
import { Snackbar, Alert } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import BreadcrumbBar from './BreadcrumbBar';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  padding: 3,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ width: 240, background: '#2f3b52', color: '#fff', padding: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        {t('documentManagement.sidebarTitle', 'DMS')}
      </Typography>
      {/* Add sidebar navigation here */}
    </Box>
  );
};

// Action buttons are rendered inside the FileExplorer for local handlers

// BreadcrumbBar extracted to ./BreadcrumbBar

const DocumentManagement: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', height: '100vh', background: '#f4f6fa' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Typography variant="h4" sx={{ marginBottom: 4 }}>
          {t('documentManagement.title', 'Document Management')}
        </Typography>
        {/* ActionButtons and breadcrumb rendered inside FileExplorer to access state handlers */}
        <Card
          title={t('documentManagement.fileExplorer', 'File Explorer')}
          variant="outlined"
          size="lg"
          color="neutral"
          sx={fileExplorerCardStyles}
        >
          {/* File explorer list with accessible actions */}
          <FileExplorer />
        </Card>
      </Box>
    </Box>
  );
};

type Item = {
  id: string;
  name: string;
  size: number; // bytes
  uploadDate: string; // ISO
  itemType: 'folder' | 'document' | 'pdf' | 'other';
};

const sampleItems: Item[] = [
  {
    id: '1',
    name: 'Project Plan.docx',
    size: 23456,
    uploadDate: '2025-08-01T10:23:00Z',
    itemType: 'document',
  },
  {
    id: '2',
    name: 'Designs.pdf',
    size: 1048576,
    uploadDate: '2025-07-28T08:12:00Z',
    itemType: 'pdf',
  },
  {
    id: '3',
    name: 'Archives',
    size: 0,
    uploadDate: '2025-06-15T12:00:00Z',
    itemType: 'folder',
  },
];

// formatSize/formatDate moved to FileListItem

function FileExplorer(): JSX.Element {
  const { t } = useTranslation();
  const api = useDmsApi();
  const [items, setItems] = React.useState<Item[]>(sampleItems);
  const currentFolderIdRef = React.useRef<string>('root');
  const [currentPath, setCurrentPath] = React.useState<
    Array<{ id: string; name: string }>
  >([{ id: 'root', name: t('documentManagement.root', 'Home') }]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteFolderConfirmOpen, setDeleteFolderConfirmOpen] =
    React.useState(false);
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [snack, setSnack] = React.useState<{
    open: boolean;
    msg?: string | null;
    severity: 'success' | 'error';
  }>({ open: false, msg: null, severity: 'success' });

  // menu handling moved into FileItemActions component

  const refresh = React.useCallback(async () => {
    try {
      const folder = await api.getFolder(currentFolderIdRef.current);
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
      // update current path if folder has id/name (attempt best-effort)
      if (folder.folders && Array.isArray(folder.folders)) {
        // noop - keep existing path
      }
    } catch {
      // ignore
    }
  }, [api]);

  // Build breadcrumb path from a folder id by walking parentId links using the API
  const buildPathFromId = React.useCallback(
    async (id: string) => {
      try {
        // stop condition for root
        if (!id || id === 'root') {
          setCurrentPath([
            { id: 'root', name: t('documentManagement.root', 'Home') },
          ]);
          return;
        }
        const path: Array<{ id: string; name: string }> = [];
        let currentId: string | undefined = id;
        let safety = 0;
        // walk up until root or parentId missing
        while (currentId && safety < 50) {
          // call getFolder and attempt to extract metadata in common shapes
          const folderData = await api.getFolder(currentId);
          const fd = folderData as Record<string, unknown>;
          // folderData may contain .folders or root-level fields
          let mdId = currentId;
          let mdName = currentId;
          let mdParent: string | undefined;
          const foldersField = fd['folders'];
          if (foldersField && typeof foldersField === 'object') {
            const f = foldersField as Record<string, unknown>;
            if (typeof f['id'] === 'string') mdId = f['id'];
            if (typeof f['name'] === 'string') mdName = f['name'];
            if (typeof f['parentId'] === 'string') mdParent = f['parentId'];
          } else if (typeof fd['id'] === 'string') {
            mdId = fd['id'] as string;
            if (typeof fd['name'] === 'string') mdName = fd['name'] as string;
            if (typeof fd['parentId'] === 'string')
              mdParent = fd['parentId'] as string;
          } else if (Array.isArray(fd['subfolders'])) {
            const subfolders = fd['subfolders'] as unknown[];
            const found = subfolders.find(
              (f) =>
                typeof (f as Record<string, unknown>)['id'] === 'string' &&
                (f as Record<string, unknown>)['id'] === currentId
            ) as Record<string, unknown> | undefined;
            if (found) {
              if (typeof found['id'] === 'string') mdId = found['id'];
              if (typeof found['name'] === 'string') mdName = found['name'];
              if (typeof found['parentId'] === 'string')
                mdParent = found['parentId'];
            }
          }
          path.push({ id: mdId, name: mdName });
          if (!mdParent || mdParent === 'root') break;
          currentId = mdParent;
          safety += 1;
        }
        // reverse to get root -> leaf
        const root = { id: 'root', name: t('documentManagement.root', 'Home') };
        const reversed = path.reverse();
        setCurrentPath([root, ...reversed]);
      } catch {
        // fallback: keep existing path
      }
    },
    [api, t]
  );

  const handleClose = () => {
    setActiveId(null);
  };

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
    // use value from dialog
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
    // wait for server confirmation before removing
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
    // same as handleDelete but keeps separate dialog state
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
    // navigate into folder
    try {
      currentFolderIdRef.current = id;
      // rebuild accurate breadcrumb by walking parents
      await buildPathFromId(id);
      // refresh will use currentFolderIdRef
      refresh();
    } catch {
      // fallback: just set id
      currentFolderIdRef.current = id;
      setCurrentPath((p) => [...p, { id, name: 'Folder' }]);
      refresh();
    }
  };

  const handleNavigatePath = (id: string) => {
    // trim path to selected id
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
    // On mount, refresh and build path for root
    (async () => {
      await refresh();
      // build path for initial folder
      await buildPathFromId(currentFolderIdRef.current);
    })();
  }, [refresh]);

  // simplified: no upload / create folder handlers here per request

  return (
    <Box
      role="region"
      aria-labelledby="file-explorer-title"
      sx={{ overflow: 'auto' }}
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
      <List aria-label="file list">
        {items.map((item) => (
          <FileListItem
            key={item.id}
            item={item}
            onRename={handleOpenRename}
            onDelete={handleOpenDelete}
            onOpen={handleOpenFolder}
          />
        ))}
      </List>

      {/* Rename dialog */}
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
          <MuiButton onClick={() => setRenameOpen(false)}>
            {t('documentManagement.renameDialog.cancel', 'Cancel')}
          </MuiButton>
          <MuiButton onClick={handleRename} variant="contained">
            {t('documentManagement.renameDialog.confirm', 'Rename')}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* per-item menu handled in FileItemActions component */}

      {/* Delete confirmation dialog */}
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
          <MuiButton onClick={() => setDeleteConfirmOpen(false)}>
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </MuiButton>
          <MuiButton onClick={handleDelete} variant="contained" color="error">
            {t('documentManagement.deleteDialog.confirm', 'Delete')}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Folder delete confirmation (warn about contained documents) */}
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
          <MuiButton onClick={() => setDeleteFolderConfirmOpen(false)}>
            {t('documentManagement.deleteDialog.cancel', 'Cancel')}
          </MuiButton>
          <MuiButton
            onClick={handleDeleteFolderConfirmed}
            variant="contained"
            color="error"
          >
            {t('documentManagement.deleteDialog.confirm', 'Delete')}
          </MuiButton>
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
          <MuiButton onClick={() => setNewFolderOpen(false)}>
            {t('documentManagement.renameDialog.cancel', 'Cancel')}
          </MuiButton>
          <MuiButton onClick={handleCreateFolder} variant="contained">
            {t('documentManagement.newFolder.create', 'Create')}
          </MuiButton>
        </DialogActions>
      </Dialog>
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

export default DocumentManagement;
