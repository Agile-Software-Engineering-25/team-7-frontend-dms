import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import Button from '@mui/joy/Button';
import { useTranslation } from 'react-i18next';

type DeleteFolderConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DeleteFolderConfirmDialog: React.FC<DeleteFolderConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-folder-confirm-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="delete-folder-confirm-title">
        {t('documentManagement.deleteFolderDialog.title', 'Delete folder')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ color: 'text.primary' }}>
          {t(
            'documentManagement.deleteFolderDialog.message',
            'Deleting this folder will also delete all contained documents. This action cannot be undone.'
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={onConfirm}
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
        <Button
          onClick={onClose}
          variant="plain"
          color="primary"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.deleteDialog.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteFolderConfirmDialog;
