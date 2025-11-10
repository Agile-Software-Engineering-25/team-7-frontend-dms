import * as React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import type { SelectChangeEvent } from '@mui/material';

type StudyGroup = {
  name: string;
  students_count: number;
};

type Props = {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
  availableGroups: StudyGroup[];
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  parentFolderGroups?: string[]; // For restricting selection in subfolders
};

const StudyGroupSelector: React.FC<Props> = ({
  selectedGroups,
  onChange,
  availableGroups,
  loading = false,
  disabled = false,
  error = null,
  parentFolderGroups,
}) => {
  const { t } = useTranslation();

  // Filter available groups based on parent folder restrictions
  const selectableGroups = React.useMemo(() => {
    if (!parentFolderGroups || parentFolderGroups.length === 0) {
      return availableGroups;
    }
    return availableGroups.filter((group) =>
      parentFolderGroups.includes(group.name)
    );
  }, [availableGroups, parentFolderGroups]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  const handleDelete = (groupToDelete: string) => {
    onChange(selectedGroups.filter((group) => group !== groupToDelete));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {t(
            'documentManagement.studyGroups.loading',
            'Loading study groups...'
          )}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error" sx={{ py: 1 }}>
        {error}
      </Typography>
    );
  }

  const isRestricted = parentFolderGroups && parentFolderGroups.length > 0;

  return (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel id="study-group-select-label">
        {t('documentManagement.studyGroups.label', 'Study Groups')}
      </InputLabel>
      <Select
        labelId="study-group-select-label"
        id="study-group-select"
        multiple
        disabled={disabled || selectableGroups.length === 0}
        value={selectedGroups}
        onChange={handleChange}
        input={
          <OutlinedInput
            label={t('documentManagement.studyGroups.label', 'Study Groups')}
          />
        }
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t(
                  'documentManagement.studyGroups.allGroups',
                  'All study groups (no restriction)'
                )}
              </Typography>
            ) : (
              selected.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  size="small"
                  onDelete={() => handleDelete(value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    backgroundColor: '#002E6D',
                    color: '#ffffff',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#ffffff',
                      },
                    },
                  }}
                />
              ))
            )}
          </Box>
        )}
      >
        {selectableGroups.length === 0 ? (
          <MenuItem disabled>
            {isRestricted
              ? t(
                  'documentManagement.studyGroups.noGroupsFromParent',
                  'No study groups available from parent folder'
                )
              : t(
                  'documentManagement.studyGroups.noGroups',
                  'No study groups available'
                )}
          </MenuItem>
        ) : (
          selectableGroups.map((group) => (
            <MenuItem key={group.name} value={group.name}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{group.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('documentManagement.studyGroups.studentCount', {
                      defaultValue: '{{count}} students',
                      count: group.students_count,
                    })}
                  </Typography>
                </Box>
                {selectedGroups.includes(group.name) && (
                  <CheckIcon sx={{ color: '#002E6D', fontSize: 20 }} />
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {isRestricted && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {t(
            'documentManagement.studyGroups.restrictedInfo',
            'Selection is restricted to study groups from parent folder'
          )}
        </Typography>
      )}
      {!isRestricted && selectedGroups.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {t(
            'documentManagement.studyGroups.noSelectionInfo',
            'No selection means all study groups can see this folder'
          )}
        </Typography>
      )}
    </FormControl>
  );
};

export default StudyGroupSelector;
