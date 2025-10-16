import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import HomeIcon from '@mui/icons-material/Home';
import { useTranslation } from 'react-i18next';
import Button from '@shared-components/Button/Button';

type FolderNode = {
  id: string;
  name: string;
  parentId?: string;
  children?: FolderNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
};

type FolderResponse = {
  subfolders?: Array<{
    id: string;
    name: string;
    parentId?: string;
    createdDate?: string;
  }>;
  path?: Array<{ id: string; name: string }>;
};

type ApiInterface = {
  getFolder: (id: string) => Promise<FolderResponse>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string) => void;
  currentFolderId: string;
  currentPath: Array<{ id: string; name: string }>;
  api: ApiInterface;
  moveSourceId?: string | null;
};

const MoveDialog: React.FC<Props> = ({
  open,
  onClose,
  onMove,
  currentFolderId,
  currentPath,
  api,
  moveSourceId,
}) => {
  const { t } = useTranslation();
  const [folderTree, setFolderTree] = React.useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Build initial tree when dialog opens
  React.useEffect(() => {
    if (open) {
      buildMoveTree();
    }
  }, [open, currentFolderId, currentPath, moveSourceId]);

  const buildMoveTree = async () => {
    setIsLoading(true);
    setSelectedFolderId('');
    try {
      const availableFolders: FolderNode[] = [];

      // 1. Add root only if we're NOT already in root directory
      // Do not add root as a destination if currentFolderId is 'root'
      if (currentFolderId !== 'root') {
        availableFolders.push({
          id: 'root',
          name: t('documentManagement.root', 'Home'),
          children: [],
        });
      }

      // 2. Add parent folders (without their subfolders)
      // Only add parents if we're not in root, and exclude the current folder and the folder being moved
      const parentPath = currentFolderId !== 'root' 
        ? currentPath.filter(p => p.id !== currentFolderId && p.id !== 'root' && p.id !== moveSourceId)
        : [];
      for (const pathItem of parentPath) {
        availableFolders.push({
          id: pathItem.id,
          name: pathItem.name,
          children: [], // Don't show subfolders of parent folders
        });
      }

      // 3. Add direct subfolders of current directory (but NOT their subfolders)
      // Exclude the folder being moved (moveSourceId)
      try {
        const currentData = await api.getFolder(currentFolderId);
        const directSubfolders = (currentData.subfolders || [])
          .filter((f) => f.id !== moveSourceId) // Don't show the folder being moved
          .map((f) => ({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
            children: [] as FolderNode[], // Don't load sub-subfolders
          }));

        availableFolders.push(...directSubfolders);
      } catch {
        // ignore errors
      }

      setFolderTree(availableFolders);
    } catch (error) {
      console.warn('Failed to build move tree:', error);
      // Fallback: show only breadcrumb path, but exclude current folder, moveSourceId, and root if we're in root
      const fallbackFolders = currentPath
        .filter((p) => p.id !== currentFolderId && p.id !== moveSourceId && (currentFolderId !== 'root' || p.id !== 'root'))
        .map((p) => ({
          id: p.id,
          name: p.name,
          children: [],
        }));
      setFolderTree(fallbackFolders);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folderId: string) => {
    // Don't allow selecting current directory
    if (folderId === currentFolderId) {
      return;
    }
    setSelectedFolderId(folderId);
  };

  const handleMove = () => {
    if (selectedFolderId && selectedFolderId !== currentFolderId) {
      onMove(selectedFolderId);
      onClose();
    }
  };

  const renderFolderList = (folders: FolderNode[]) => {
    return folders.map((folder) => {
      const isCurrentFolder = folder.id === currentFolderId;
      const isSelected = folder.id === selectedFolderId;
      const isDisabled = isCurrentFolder;

      return (
        <ListItem key={folder.id} disablePadding>
          <ListItemButton
            onClick={() => handleFolderClick(folder.id)}
            disabled={isDisabled}
            selected={isSelected}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {folder.id === 'root' ? (
                <HomeIcon fontSize="small" />
              ) : (
                <FolderIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2">
                  {folder.name}
                  {isCurrentFolder &&
                    ` (${t('documentManagement.moveDialog.currentFolder', 'aktueller Ordner')})`}
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="move-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="move-dialog-title">
        {t('documentManagement.moveDialog.title', 'Element verschieben')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t(
            'documentManagement.moveDialog.instruction',
            'Wählen Sie einen Zielordner aus. Sie können in übergeordnete Ordner oder Unterordner des aktuellen Verzeichnisses verschieben.'
          )}
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            {renderFolderList(folderTree)}
          </List>
        )}

        {selectedFolderId && (
          <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
            {t('documentManagement.moveDialog.selectedFolder', 'Ausgewählt:')}{' '}
            {folderTree.find((n) => n.id === selectedFolderId)?.name ||
              selectedFolderId}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="soft">
          {t('documentManagement.moveDialog.cancel', 'Abbrechen')}
        </Button>
        <Button
          onClick={handleMove}
          variant="solid"
          disabled={!selectedFolderId || selectedFolderId === currentFolderId}
        >
          {t('documentManagement.moveDialog.confirm', 'Verschieben')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDialog;
