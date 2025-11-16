import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Typography,
} from '@mui/material';
import Button from '@mui/joy/Button';
import { useTranslation } from 'react-i18next';
import type { TagEntity } from '@/@types/fileExplorer';

type DeleteTagDialogProps = {
  open: boolean;
  tag: TagEntity | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

const DeleteTagDialog: React.FC<DeleteTagDialogProps> = ({
  open,
  tag,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      aria-labelledby="delete-tag-dialog-title"
      aria-describedby="delete-tag-dialog-description"
    >
      <DialogTitle id="delete-tag-dialog-title">
        {t('documentManagement.tagging.deleteTagTitle', 'Delete tag')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-tag-dialog-description">
          {t(
            'documentManagement.tagging.deleteTagMessage',
            `Are you sure you want to delete the tag "${tag?.name}"?`
          )}
        </DialogContentText>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t(
              'documentManagement.tagging.deleteInfo',
              'If you delete this tag, it will be removed from all associated files.'
            )}
          </Typography>
          <Typography variant="body2" color="warning" mt={1}>
            <strong>
              {t(
                'documentManagement.tagging.deleteWarning',
                'This action cannot be undone.'
              )}
            </strong>
          </Typography>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirm}
          disabled={isProcessing}
          autoFocus
          variant="solid"
          color="danger"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
            '--Button-minHeight': '34px',
            '--Button-paddingInline': '16px',
            '--Button-bg': '#d32f2f',
            '--Button-color': '#ffffff',
            '--Button-hoverBg': '#c62828',
            '--Button-activeBg': '#b71c1c',
            fontWeight: 600,
          }}
        >
          {t('documentManagement.tagging.delete', 'Delete')}
        </Button>
        <Button
          onClick={onClose}
          disabled={isProcessing}
          variant="plain"
          color="primary"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.tagging.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTagDialog;
