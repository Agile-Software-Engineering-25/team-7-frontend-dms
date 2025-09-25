import * as React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from 'react-i18next';
import { emitRequestMove } from '../../lib/dmsEvents';

type Props = {
  itemId: string;
  itemName: string;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
};

const FileItemActions: React.FC<Props> = ({
  itemId,
  itemName,
  onRename,
  onDelete,
  onDownload,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
        >
          <MoreVertIcon aria-hidden />
        </IconButton>
      </Tooltip>

      <Menu
        id={`item-menu-${itemId}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ role: 'menu' }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onRename();
          }}
        >
          {t('documentManagement.rename', 'Rename')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            emitRequestMove(itemId);
          }}
        >
          {t('documentManagement.move', 'Move')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onDownload();
          }}
        >
          {t('documentManagement.downloadDocument.download', 'Download')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onDelete();
          }}
        >
          {t('documentManagement.delete', 'Delete')}
        </MenuItem>
      </Menu>
    </ListItemSecondaryAction>
  );
};

export default FileItemActions;
