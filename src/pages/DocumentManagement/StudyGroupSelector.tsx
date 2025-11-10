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
  Checkbox,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
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
  parentFolderGroups?: string[];
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
    const newGroups = typeof value === 'string' ? value.split(',') : value;
    // Append new groups to existing ones instead of replacing
    const updatedGroups = [...new Set([...selectedGroups, ...newGroups])];
    onChange(updatedGroups);
  };

  // Toggle a group on/off
  const handleToggleGroup = (groupName: string) => {
    if (selectedGroups.includes(groupName)) {
      // Remove the group
      onChange(selectedGroups.filter((g) => g !== groupName));
    } else {
      // Add the group to existing ones
      onChange([...selectedGroups, groupName]);
    }
  };

  const handleDelete = (groupToDelete: string) => {
    onChange(selectedGroups.filter((group) => group !== groupToDelete));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {t('documentManagement.studyGroups.loading')}
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

  // Get student count for a group name
  const getStudentCount = (groupName: string) => {
    const group = availableGroups.find((g) => g.name === groupName);
    return group?.students_count || 0;
  };

  return (
    <Box>
      {/* Current Study Groups Section */}
      {selectedGroups.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, fontWeight: 600, color: '#002E6D' }}
          >
            {t('documentManagement.studyGroups.currentGroups')} (
            {selectedGroups.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedGroups.map((groupName) => {
              const studentCount = getStudentCount(groupName);
              const studentCountText =
                studentCount === 1
                  ? `${studentCount} ${t('documentManagement.studyGroups.studentCount_one')}`
                  : `${studentCount} ${t('documentManagement.studyGroups.studentCount_other')}`;

              return (
                <Chip
                  key={groupName}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{groupName}</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          opacity: 0.8,
                          marginLeft: '4px',
                        }}
                      >
                        ({studentCountText})
                      </span>
                    </Box>
                  }
                  onDelete={() => handleDelete(groupName)}
                  disabled={disabled}
                  sx={{
                    backgroundColor: '#002E6D',
                    color: '#ffffff',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#ffffff',
                      },
                    },
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      backgroundColor: '#002E6D',
                      color: '#ffffff',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      {selectedGroups.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('documentManagement.studyGroups.noSelectionInfo')}
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Add Study Groups Section */}
      <Typography
        variant="subtitle2"
        sx={{ mb: 1.5, fontWeight: 600, color: '#002E6D' }}
      >
        {t('documentManagement.studyGroups.addGroups')}
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="study-group-select-label">
          {t('documentManagement.studyGroups.selectLabel')}
        </InputLabel>
        <Select
          labelId="study-group-select-label"
          id="study-group-select"
          multiple
          disabled={disabled || selectableGroups.length === 0}
          value={[]} // Always empty since we're adding to existing list
          onChange={handleChange}
          input={
            <OutlinedInput
              label={t('documentManagement.studyGroups.selectLabel')}
            />
          }
          renderValue={() => (
            <Typography variant="body2" color="text.secondary">
              {t('documentManagement.studyGroups.selectPlaceholder')}
            </Typography>
          )}
        >
          {selectableGroups.length === 0 ? (
            <MenuItem disabled>
              {isRestricted
                ? t('documentManagement.studyGroups.noGroupsFromParent')
                : t('documentManagement.studyGroups.noGroups')}
            </MenuItem>
          ) : (
            selectableGroups.map((group) => {
              const isSelected = selectedGroups.includes(group.name);
              const studentCountText =
                group.students_count === 1
                  ? `${group.students_count} ${t('documentManagement.studyGroups.studentCount_one')}`
                  : `${group.students_count} ${t('documentManagement.studyGroups.studentCount_other')}`;

              return (
                <MenuItem
                  key={group.name}
                  value={group.name}
                  onClick={() => handleToggleGroup(group.name)}
                  disabled={isSelected}
                >
                  <Checkbox
                    checked={isSelected}
                    sx={{
                      color: '#002E6D',
                      '&.Mui-checked': {
                        color: '#4caf50',
                      },
                    }}
                  />
                  <ListItemText
                    primary={group.name}
                    secondary={studentCountText}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isSelected ? 600 : 400,
                      },
                    }}
                  />
                  {isSelected && (
                    <CheckIcon
                      sx={{
                        color: '#4caf50',
                        ml: 'auto',
                        fontSize: 24,
                      }}
                    />
                  )}
                </MenuItem>
              );
            })
          )}
        </Select>
        {isRestricted && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('documentManagement.studyGroups.restrictedInfo')}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default StudyGroupSelector;