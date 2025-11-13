import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import Button from '@mui/joy/Button';
import { useTranslation } from 'react-i18next';

type RenameDialogProps = {
  open: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  value,
  onValueChange,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="rename-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="rename-title">
        {t('documentManagement.renameDialog.title', 'Rename')}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          label={t('documentManagement.renameDialog.label', 'New name')}
          fullWidth
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onConfirm();
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={onConfirm}
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
          {t('documentManagement.renameDialog.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
