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
import Button from '@mui/joy/Button';
import StudyGroupSelector from './StudyGroupSelector';


type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (selectedGroups: string[]) => Promise<void>;
  folderName: string;
  currentGroups: string[];
  availableGroups: string[] | undefined;
  loading?: boolean;
  error?: string | null;
  parentFolderGroups?: string[];
};

const ManageStudyGroupsDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  currentGroups,
  availableGroups,
  loading = false,
  error = null,
  parentFolderGroups,
}) => {
  const { t } = useTranslation();
  const [selectedGroups, setSelectedGroups] =
    React.useState<string[]>(currentGroups);
  const [saving, setSaving] = React.useState(false);

  // Update selected groups when currentGroups changes (dialog opens)
  React.useEffect(() => {
    if (open) {
      setSelectedGroups(currentGroups);
    }
  }, [open, currentGroups]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedGroups);
      onClose();
    } catch (error) {
      console.error(t('documentManagement.studyGroups.failedSave'), error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify([...selectedGroups].sort()) !==
    JSON.stringify([...currentGroups].sort());

  const isRestricted = parentFolderGroups && parentFolderGroups.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="manage-study-groups-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="manage-study-groups-title">
        {t('documentManagement.studyGroups.manageTitle')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isRestricted
            ? t('documentManagement.studyGroups.manageDescriptionRestricted',
                'Select which study groups can access this folder. You can only select from groups that have access to the parent folder.')
            : t('documentManagement.studyGroups.manageDescription',
                'Select which study groups can access this folder. If no groups are selected, the folder will be public.')}
        </Typography>

        <StudyGroupSelector
          selectedGroups={selectedGroups}
          onChange={setSelectedGroups}
          availableGroups={availableGroups}
          loading={loading}
          disabled={saving}
          error={error}
          parentFolderGroups={parentFolderGroups}
        />

        {isRestricted && (
          <Box
            sx={{ mt: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              <strong>
                {t('documentManagement.studyGroups.parentRestrictionTitle', 'Parent Folder Restriction')}
              </strong>
              <br />
              {t('documentManagement.studyGroups.parentRestrictionContent',
                'This folder can only be assigned to student groups that are also assigned to its parent folder. There has to be at least one student group assigned.')}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
        <Button
          onClick={handleSave}
          variant="solid"
          disabled={saving || !hasChanges}
          loading={saving}
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
          {t('documentManagement.studyGroups.save')}
        </Button>
        <Button
          onClick={onClose}
          variant="plain"
          color="primary"
          disabled={saving}
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.studyGroups.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageStudyGroupsDialog;