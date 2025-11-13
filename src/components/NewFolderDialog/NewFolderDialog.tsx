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
import StudyGroupSelector from '@components/StudyGroupSelector/StudyGroupSelector';

type NewFolderDialogProps = {
  open: boolean;
  folderName: string;
  studyGroups: string[];
  onFolderNameChange: (value: string) => void;
  onStudyGroupsChange: (groups: string[]) => void;
  onClose: () => void;
  onConfirm: () => void;
  availableGroups?: string[];
  studyGroupsLoading: boolean;
  studyGroupsError: string | null;
  parentFolderGroups?: string[];
};

const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  open,
  folderName,
  studyGroups,
  onFolderNameChange,
  onStudyGroupsChange,
  onClose,
  onConfirm,
  availableGroups,
  studyGroupsLoading,
  studyGroupsError,
  parentFolderGroups,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onConfirm();
            }
          }}
        />

        <StudyGroupSelector
          selectedGroups={studyGroups}
          onChange={onStudyGroupsChange}
          availableGroups={availableGroups}
          loading={studyGroupsLoading}
          error={studyGroupsError}
          parentFolderGroups={parentFolderGroups}
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
          {t('documentManagement.newFolder.create', 'Create')}
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
          {t('documentManagement.newFolder.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewFolderDialog;
