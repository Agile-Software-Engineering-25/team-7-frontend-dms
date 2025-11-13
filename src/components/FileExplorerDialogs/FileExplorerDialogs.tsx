import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import StudyGroupSelector from '@components/StudyGroupSelector/StudyGroupSelector';
import { isTooLarge } from '@utils/fileHelpers';
import { MAX_FILE_SIZE_MB } from '@/@types/fileExplorer';

type FileExplorerDialogsProps = {
  // Rename Dialog
  renameOpen: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameClose: () => void;
  onRenameConfirm: () => void;

  // Delete Dialog
  deleteConfirmOpen: boolean;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;

  // Delete Folder Dialog
  deleteFolderConfirmOpen: boolean;
  onDeleteFolderClose: () => void;
  onDeleteFolderConfirm: () => void;

  // New Folder Dialog
  newFolderOpen: boolean;
  newFolderName: string;
  newFolderStudyGroups: string[];
  onNewFolderNameChange: (value: string) => void;
  onNewFolderStudyGroupsChange: (groups: string[]) => void;
  onNewFolderClose: () => void;
  onNewFolderConfirm: () => void;
  studyGroups?: string[];
  studyGroupsLoading: boolean;
  studyGroupsError: string | null;
  manageGroupsParentGroups?: string[];

  // Upload Dialog
  uploadOpen: boolean;
  selectedFiles: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelection: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onUploadClose: () => void;
  onUploadConfirm: () => void;
};

const FileExplorerDialogs: React.FC<FileExplorerDialogsProps> = ({
  renameOpen,
  renameValue,
  onRenameValueChange,
  onRenameClose,
  onRenameConfirm,
  deleteConfirmOpen,
  onDeleteClose,
  onDeleteConfirm,
  deleteFolderConfirmOpen,
  onDeleteFolderClose,
  onDeleteFolderConfirm,
  newFolderOpen,
  newFolderName,
  newFolderStudyGroups,
  onNewFolderNameChange,
  onNewFolderStudyGroupsChange,
  onNewFolderClose,
  onNewFolderConfirm,
  studyGroups,
  studyGroupsLoading,
  studyGroupsError,
  manageGroupsParentGroups,
  uploadOpen,
  selectedFiles,
  fileInputRef,
  onFileSelection,
  onRemoveFile,
  onUploadClose,
  onUploadConfirm,
}) => {
  const { t } = useTranslation();

  const hasInvalidFiles = selectedFiles.some((file) =>
    isTooLarge(file, MAX_FILE_SIZE_MB)
  );

  return (
    <>
      {/* Rename Dialog */}
      <Dialog
        open={renameOpen}
        onClose={onRenameClose}
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
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            onClick={onRenameConfirm}
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
            onClick={onRenameClose}
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

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={onDeleteClose}
        aria-labelledby="delete-confirm-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="delete-confirm-title">
          {t('documentManagement.deleteDialog.title', 'Delete')}
        </DialogTitle>
        <DialogContent dividers>
          {t(
            'documentManagement.deleteDialog.message',
            'Are you sure you want to delete this item?'
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            onClick={onDeleteConfirm}
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
            onClick={onDeleteClose}
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

      {/* Folder Delete Confirmation */}
      <Dialog
        open={deleteFolderConfirmOpen}
        onClose={onDeleteFolderClose}
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
            onClick={onDeleteFolderConfirm}
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
            onClick={onDeleteFolderClose}
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

      {/* New Folder Dialog */}
      <Dialog
        open={newFolderOpen}
        onClose={onNewFolderClose}
        aria-labelledby="new-folder-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="new-folder-title">
          {t('documentManagement.newFolder.title', 'Create folder')}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label={t('documentManagement.newFolder.label', 'Folder name')}
            fullWidth
            value={newFolderName}
            onChange={(e) => onNewFolderNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onNewFolderConfirm();
              }
            }}
          />

          <StudyGroupSelector
            selectedGroups={newFolderStudyGroups}
            onChange={onNewFolderStudyGroupsChange}
            availableGroups={studyGroups}
            loading={studyGroupsLoading}
            error={studyGroupsError}
            parentFolderGroups={manageGroupsParentGroups}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            onClick={onNewFolderConfirm}
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
            {t('documentManagement.newFolder.create', 'Create')}
          </Button>
          <Button
            onClick={onNewFolderClose}
            variant="plain"
            color="primary"
            sx={{
              '--Button-radius': '8px',
              '--Button-shadow': 'none',
              '--Button-hoverShadow': 'none',
            }}
          >
            {t('documentManagement.newFolder.cancel', 'Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={onUploadClose}
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
            onClick={onUploadConfirm}
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
            {t('documentManagement.uploadDocument.confirm', 'upload')}
          </Button>
          <Button
            onClick={onUploadClose}
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
    </>
  );
};

export default FileExplorerDialogs;
