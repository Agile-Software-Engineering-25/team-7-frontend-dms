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

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  padding: 3,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const Sidebar: React.FC = () => (
  <Box sx={{ width: 240, background: '#2f3b52', color: '#fff', padding: 2 }}>
    <Typography variant="h6" sx={{ marginBottom: 2 }}>
      DMS
    </Typography>
    {/* Add sidebar navigation here */}
  </Box>
);

const ActionButtons: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
      {/* kept minimal as requested */}
  <Typography variant="body2">{t('documentManagement.actionsNote', 'Manage files below')}</Typography>
    </Box>
  );
};

const Breadcrumb: React.FC = () => (
  <Box sx={{ marginBottom: 2 }}>
    <Typography variant="body2" sx={{ color: '#555', fontWeight: 500 }}>
      Home / Documents / Current Folder
    </Typography>
  </Box>
);

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
      <ActionButtons />
      <Breadcrumb />
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
  { id: '1', name: 'Project Plan.docx', size: 23456, uploadDate: '2025-08-01T10:23:00Z', itemType: 'document' },
  { id: '2', name: 'Designs.pdf', size: 1048576, uploadDate: '2025-07-28T08:12:00Z', itemType: 'pdf' },
  { id: '3', name: 'Archives', size: 0, uploadDate: '2025-06-15T12:00:00Z', itemType: 'folder' },
];

// formatSize/formatDate moved to FileListItem

function FileExplorer(): JSX.Element {
  const { t } = useTranslation();
  const api = useDmsApi();
  const [items, setItems] = React.useState<Item[]>(sampleItems);
  const currentFolderIdRef = React.useRef<string>('root');
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [snack, setSnack] = React.useState<{ open: boolean; msg?: string | null; severity: 'success' | 'error' }>(
    { open: false, msg: null, severity: 'success' }
  );

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
    } catch {
      // ignore
    }
  }, [api]);

  const handleClose = () => {
    setActiveId(null);
  };

  const getItemById = (id?: string | null) => items.find((i) => i.id === (id ?? ''));

  const showSnack = (msg: string, severity: 'success' | 'error' = 'success') => {
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
    setDeleteConfirmOpen(true);
  };

  const handleRename = async () => {
    if (!activeId) return handleClose();
    const it = items.find((i) => i.id === activeId);
    if (!it) return handleClose();
    // use value from dialog
    const newName = renameValue.trim();
    if (newName && it) {
      setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, name: newName } : p)));
      try {
        await api.renameDocument(it.id, newName);
  showSnack(t('documentManagement.snack.renamed', 'Renamed'), 'success');
      } catch (err) {
        setItems((prev) => prev.map((p) => (p.id === it.id ? it : p)));
  showSnack(t('documentManagement.snack.renameFailed', 'Rename failed'), 'error');
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
      await api.deleteDocument(it.id);
      setItems((prev) => prev.filter((p) => p.id !== activeId));
  showSnack(t('documentManagement.snack.deleted', 'Deleted'), 'success');
    } catch (err) {
  showSnack(t('documentManagement.snack.deleteFailed', 'Delete failed'), 'error');
    }
    setDeleteConfirmOpen(false);
    handleClose();
  };

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // simplified: no upload / create folder handlers here per request

  return (
    <Box role="region" aria-labelledby="file-explorer-title" sx={{ overflow: 'auto' }}>
      <Typography id="file-explorer-title" sx={{ mb: 2 }} variant="h6">
        {t('documentManagement.files', 'Files')}
      </Typography>
      <List aria-label="file list">
        {items.map((item) => (
          <FileListItem key={item.id} item={item} onRename={handleOpenRename} onDelete={handleOpenDelete} />
        ))}
      </List>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} aria-labelledby="rename-title">
        <DialogTitle id="rename-title">{t('documentManagement.renameDialog.title', 'Rename')}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label={t('documentManagement.renameDialog.label', 'New name')} fullWidth value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setRenameOpen(false)}>{t('documentManagement.renameDialog.cancel', 'Cancel')}</MuiButton>
          <MuiButton onClick={handleRename} variant="contained">{t('documentManagement.renameDialog.confirm', 'Rename')}</MuiButton>
        </DialogActions>
      </Dialog>

  {/* per-item menu handled in FileItemActions component */}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-confirm-title"
      >
        <DialogTitle id="delete-confirm-title">{t('documentManagement.deleteDialog.title', 'Delete')}</DialogTitle>
        <DialogContent>
          {t('documentManagement.deleteDialog.message', 'Are you sure you want to delete this item?')}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteConfirmOpen(false)}>{t('documentManagement.deleteDialog.cancel', 'Cancel')}</MuiButton>
          <MuiButton onClick={handleDelete} variant="contained" color="error">
            {t('documentManagement.deleteDialog.confirm', 'Delete')}
          </MuiButton>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentManagement;
