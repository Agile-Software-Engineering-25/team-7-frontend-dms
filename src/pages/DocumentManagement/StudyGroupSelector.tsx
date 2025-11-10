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
    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  // Toggle a group on/off
  const handleToggleGroup = (groupName: string) => {
    if (selectedGroups.includes(groupName)) {
      // Remove the group
      onChange(selectedGroups.filter((g) => g !== groupName));
    } else {
      // Add the group
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

  return (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel id="study-group-select-label">
        {t('documentManagement.studyGroups.label')}
      </InputLabel>
      <Select
        labelId="study-group-select-label"
        id="study-group-select"
        multiple
        disabled={disabled || selectableGroups.length === 0}
        value={selectedGroups}
        onChange={handleChange}
        input={
          <OutlinedInput label={t('documentManagement.studyGroups.label')} />
        }
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('documentManagement.studyGroups.allGroups')}
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
      {!isRestricted && selectedGroups.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('documentManagement.studyGroups.noSelectionInfo')}
        </Typography>
      )}
    </FormControl>
  );
};

export default StudyGroupSelector;
