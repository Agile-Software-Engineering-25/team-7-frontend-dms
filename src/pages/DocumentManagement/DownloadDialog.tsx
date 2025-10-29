import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  ListItemButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Button from '@mui/joy/Button';
import type { Item } from './FileListItem';

type DownloadDialogProps = {
  open: boolean;
  onClose: () => void;
  items: Item[];
  onConfirm: (selectedIds: string[]) => void;
};

const DownloadDialog: React.FC<DownloadDialogProps> = ({
  open,
  onClose,
  items,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'all' | 'select'>('all');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (mode === 'all') {
      if (!items || items.length === 0) {
        alert(
          t(
            'documentManagement.snack.noDocsInFolder',
            'No documents or folders in current directory'
          )
        );
        return;
      }
      onConfirm(items.map((i) => i.id));
      onClose();
    } else {
      if (selected.length === 0) {
        alert(
          t(
            'documentManagement.snack.noDocsInFolder',
            'No documents or folders in current directory'
          )
        );
        return;
      }
      onConfirm(selected);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-aria-labelledby="download-title"
    >
      <DialogTitle id="download-title">
        {t('documentManagement.downloadDocument.title', 'Download documents')}
      </DialogTitle>
      <DialogContent dividers>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as 'all' | 'select')}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={t(
                'documentManagement.downloadDocument.allDocs',
                'Download all documents'
              )}
            />
            <FormControlLabel
              value="select"
              control={<Radio />}
              label={t(
                'documentManagement.downloadDocument.selectedDocs',
                'Choose documents'
              )}
            />
          </RadioGroup>
        </FormControl>

        {mode === 'select' && (
          <List dense>
            {items.map((doc) => (
              <ListItem key={doc.id} disablePadding secondaryAction={null}>
                <ListItemButton onClick={() => toggleItem(doc.id)}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selected.includes(doc.id)}
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    secondary={
                      doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={handleConfirm}
          variant="solid"
          disabled={mode === 'select' && selected.length === 0}
          sx={{
            '--Button-radius': '8px',
            '--Button-minHeight': '34px',
            '--Button-paddingInline': '16px',
            '--Button-bg': '#002E6D',
            '--Button-color': '#ffffff',
            '--Button-hoverBg': '#001f56',
            '--Button-activeBg': '#001a4a',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
            fontWeight: 600,
          }}
        >
          {t('documentManagement.downloadDocument.confirm', 'Confirm')}
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
          {t('documentManagement.downloadDocument.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadDialog;
