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
import type { TagEntity } from '@/@types/fileExplorer';

type ManageTagDialogProps = {
  open: boolean;
  tag: TagEntity | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
};

const ManageTagDialog: React.FC<ManageTagDialogProps> = ({
  open,
  tag,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [editedTagName, setEditedTagName] = React.useState('');

  React.useEffect(() => {
    if (open && tag) {
      setEditedTagName(tag.name);
    }
  }, [open, tag]);

  const handleConfirm = async () => {
    if (editedTagName.trim()) {
      await onConfirm(editedTagName.trim());
      setEditedTagName('');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setEditedTagName('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-tag-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="edit-tag-dialog-title">
        {t('documentManagement.tagging.editTagTitle', 'Tag bearbeiten')}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          label={t('documentManagement.tagging.tagName', 'Tag-Name')}
          type="text"
          fullWidth
          variant="outlined"
          value={editedTagName}
          onChange={(e) => setEditedTagName(e.target.value)}
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && editedTagName.trim()) {
              handleConfirm();
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing || !editedTagName.trim()}
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
          {t('documentManagement.tagging.save', 'Speichern')}
        </Button>
        <Button
          onClick={handleClose}
          disabled={isProcessing}
          variant="plain"
          color="primary"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.tagging.cancel', 'Abbrechen')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageTagDialog;
