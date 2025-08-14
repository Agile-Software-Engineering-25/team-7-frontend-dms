import * as React from 'react';
import { IconButton, Menu, MenuItem, ListItemSecondaryAction, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  itemId: string;
  itemName: string;
  onRename: () => void;
  onDelete: () => void;
};

const FileItemActions: React.FC<Props> = ({ itemId, itemName, onRename, onDelete }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
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
          <span aria-hidden>⋯</span>
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
