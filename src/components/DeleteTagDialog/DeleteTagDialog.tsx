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
        {t('documentManagement.tagging.deleteTagTitle', 'Tag löschen')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-tag-dialog-description">
          {t(
            'documentManagement.tagging.deleteTagMessage',
            `Möchten Sie den Tag "${tag?.name}" wirklich löschen?`
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
              'Tags können nur gelöscht werden, wenn sie keinem Dokument zugwiesen sind'
            )}
          </Typography>
          <Typography variant="body2" color="warning" mt={1}>
            <strong>
              {t(
                'documentManagement.tagging.deleteWarning',
                'Diese Aktion kann nicht rückgängig gemacht werden'
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
          {t('documentManagement.tagging.delete', 'Löschen')}
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
          {t('documentManagement.tagging.cancel', 'Abbrechen')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTagDialog;
