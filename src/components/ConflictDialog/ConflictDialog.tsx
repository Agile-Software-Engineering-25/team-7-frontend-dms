import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/joy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type ConflictAction = 'overwrite' | 'rename' | 'cancel';

interface ConflictDialogProps {
  open: boolean;
  conflictName: string;
  conflictType: 'file' | 'folder';
  onAction: (action: ConflictAction) => void;
}

const ConflictDialog: React.FC<ConflictDialogProps> = ({
  open,
  conflictName,
  conflictType,
  onAction,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={() => onAction('cancel')}
      aria-labelledby="conflict-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="conflict-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          {t('documentManagement.conflictDialog.title', 'Name conflict')}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {conflictType === 'file'
            ? t('documentManagement.conflictDialog.messageFile', {
                defaultValue:
                  'Eine Datei mit dem Namen existiert bereits in diesem Verzeichnis.',
                name: conflictName,
              })
            : t('documentManagement.conflictDialog.messageFolder', {
                defaultValue:
                  'Ein Ordner mit dem Namen existiert bereits in diesem Verzeichnis.',
                name: conflictName,
              })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            'documentManagement.conflictDialog.question',
            'Was möchten Sie tun?'
          )}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: 'column',
          gap: 1.5,
          p: 2,
          pt: 0,
          alignItems: 'stretch',
          '& > *': {
            margin: '0 !important',
          },
        }}
      >
        <Button
          onClick={() => onAction('overwrite')}
          variant="solid"
          color="danger"
          fullWidth
          sx={{
            textAlign: 'center',
            px: 2,
            py: 1,
          }}
        >
          {t('documentManagement.conflictDialog.overwrite', 'Overwrite')}
        </Button>
        <Button
          onClick={() => onAction('rename')}
          variant="solid"
          color="primary"
          fullWidth
          sx={{
            textAlign: 'center',
            px: 2,
            py: 1,
          }}
        >
          {t(
            'documentManagement.conflictDialog.autoRename',
            'Automatisch umbenennen'
          )}
        </Button>
        <Button
          onClick={() => onAction('cancel')}
          variant="outlined"
          fullWidth
          sx={{
            textAlign: 'center',
            px: 2,
            py: 1,
          }}
        >
          {t('documentManagement.conflictDialog.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConflictDialog;
