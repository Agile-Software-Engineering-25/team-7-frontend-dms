import * as React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupIcon from '@mui/icons-material/Group';
import { useTranslation } from 'react-i18next';
import { emitRequestMove } from '../../lib/dmsEvents';
import { useCanAccess } from '@/lib/permissions';

type Props = {
  itemId: string;
  itemName: string;
  itemType: 'folder' | 'document' | 'pdf' | 'other';
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onManageGroups?: () => void; // Only for folders
};

const FileItemActions: React.FC<Props> = ({
  itemId,
  itemName,
  itemType,
  onRename,
  onDelete,
  onDownload,
  onManageGroups,
}) => {
  const { canAccess } = useCanAccess();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const canManageDocuments = canAccess('manageDocuments');
  const isFolder = itemType === 'folder';

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  return (
    <ListItemSecondaryAction>
      <Tooltip title={t('documentManagement.moreActions', 'More actions')}>
        <IconButton
          edge="end"
          aria-label={`Open actions for ${itemName}`}
          aria-controls={open ? `item-menu-${itemId}` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleOpen}
          size="small"
          disableRipple
          sx={{
            color: '#002E6D',
            padding: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(0, 46, 109, 0.08)',
            },
          }}
        >
          <MoreVertIcon aria-hidden sx={{ fontSize: 22 }} />
        </IconButton>
      </Tooltip>

      <Menu
        id={`item-menu-${itemId}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ role: 'menu' }}
      >
        {canManageDocuments && (
          <MenuItem
            onClick={() => {
              handleClose();
              onRename();
            }}
          >
            {t('documentManagement.rename', 'Rename')}
          </MenuItem>
        )}
        {canManageDocuments && isFolder && onManageGroups && (
          <MenuItem
            onClick={() => {
              handleClose();
              onManageGroups();
            }}
          >
            <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
            {t('documentManagement.manageStudyGroups', 'Manage Study Groups')}
          </MenuItem>
        )}
        {canManageDocuments && (
          <MenuItem
            onClick={() => {
              handleClose();
              emitRequestMove(itemId);
            }}
          >
            {t('documentManagement.move', 'Move')}
          </MenuItem>
        )}
        {canAccess('downloadDocuments') && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDownload();
            }}
          >
            {t('documentManagement.downloadDocument.download', 'Download')}
          </MenuItem>
        )}
        {canManageDocuments && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete();
            }}
          >
            {t('documentManagement.delete', 'Delete')}
          </MenuItem>
        )}
      </Menu>
    </ListItemSecondaryAction>
  );
};

export default FileItemActions;
