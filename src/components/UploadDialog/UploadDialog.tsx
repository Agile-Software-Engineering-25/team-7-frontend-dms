import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/joy/Button';
import { useTranslation } from 'react-i18next';
import { isTooLarge } from '@utils/fileHelpers';
import { MAX_FILE_SIZE_MB } from '@/@types/fileExplorer';

type UploadDialogProps = {
  open: boolean;
  selectedFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelection: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  selectedFiles,
  fileInputRef,
  onFileSelection,
  onRemoveFile,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const hasInvalidFiles = selectedFiles.some((file) =>
    isTooLarge(file, MAX_FILE_SIZE_MB)
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="upload-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="upload-dialog-title">
        {t('documentManagement.uploadDocument.title', 'Upload document')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t(
            'documentManagement.uploadDocument.maxSize',
            'Maximum 5 MB per file.'
          )}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {selectedFiles.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', color: 'text.secondary', mb: 1 }}
            >
              {t(
                'documentManagement.uploadDocument.noFiles',
                'No file selected.'
              )}
            </Typography>
          ) : (
            <List
              dense
              sx={{ width: '100%' }}
              aria-label={t(
                'documentManagement.uploadDocument.selected',
                'Selected files:'
              )}
            >
              {selectedFiles.map((file, idx) => (
                <ListItem
                  key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                  aria-invalid={
                    isTooLarge(file, MAX_FILE_SIZE_MB) ? 'true' : undefined
                  }
                  secondaryAction={
                    <Tooltip
                      title={t(
                        'documentManagement.uploadDocument.removeFile',
                        'Remove file'
                      )}
                      sx={{
                        backgroundColor: '#ffe5e5',
                      }}
                    >
                      <IconButton
                        edge="end"
                        aria-label={t(
                          'documentManagement.uploadDocument.removeFile',
                          'Remove file'
                        )}
                        onClick={() => onRemoveFile(idx)}
                        color="error"
                        size="small"
                      >
                        <CloseIcon fontSize="small" aria-hidden />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={file.name}
                    primaryTypographyProps={{
                      sx: {
                        ...(isTooLarge(file, MAX_FILE_SIZE_MB) && {
                          color: 'error.main',
                        }),
                      },
                    }}
                    secondary={
                      <>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {isTooLarge(file, MAX_FILE_SIZE_MB) && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ fontWeight: 500, ml: 1 }}
                            role="alert"
                          >
                            {t(
                              'documentManagement.uploadDocument.fileTooLarge',
                              {
                                defaultValue: 'too large',
                              }
                            )}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="soft"
              sx={{
                '--Button-radius': '8px',
                '--Button-shadow': 'none',
                '--Button-hoverShadow': 'none',
              }}
            >
              {t(
                'documentManagement.uploadDocument.selectFiles',
                'Select files:'
              )}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  onFileSelection(files);
                }}
              />
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={onConfirm}
          variant="solid"
          disabled={selectedFiles.length === 0 || hasInvalidFiles}
          aria-disabled={
            selectedFiles.length === 0 || hasInvalidFiles ? 'true' : undefined
          }
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
          {t('documentManagement.uploadDocument.confirm', 'Upload')}
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
          {t('documentManagement.uploadDocument.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
