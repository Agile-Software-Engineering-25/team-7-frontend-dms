import * as React from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
  availableGroups: string[] | undefined;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  parentFolderGroups?: string[] | undefined;
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
    return parentFolderGroups;
  }, [availableGroups, parentFolderGroups]);

  // FIX: Simplified handleChange that doesn't append, just sets the value
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
      if (
        selectedGroups.length == 1 &&
        parentFolderGroups &&
        parentFolderGroups.length >= 1
      )
        return;
      handleDelete(groupName);
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

  return (
    <Box>
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
          value={selectedGroups}
          onChange={handleChange}
          disabled={disabled}
          input={
            <OutlinedInput
              label={t('documentManagement.studyGroups.selectLabel')}
            />
          }
          renderValue={() => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedGroups.map((groupName) => {
                return (
                  <Chip
                    key={groupName}
                    label={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <span>{groupName}</span>
                      </Box>
                    }
                    onMouseDown={(e) => {
                      // Verhindert, dass MUI Select beim MouseDown toggelt
                      e.stopPropagation();
                    }}
                    onDelete={(e) => {
                      // Verhindert das Öffnen/Schließen des Selects bevor delete verarbeitet wird
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(groupName);
                    }}
                    disabled={disabled}
                    sx={{
                      backgroundColor: '#002E6D',
                      color: '#ffffff',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: '#ffffff',
                        },
                        // Sicherstellen, dass das Icon Klicks annimmt
                        pointerEvents: 'auto',
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
          )}
        >
          {selectableGroups?.length === 0 ? (
            <MenuItem disabled>
              {isRestricted
                ? t('documentManagement.studyGroups.noGroupsFromParent')
                : t('documentManagement.studyGroups.noGroups')}
            </MenuItem>
          ) : (
            selectableGroups?.map((group) => {
              const isSelected = selectedGroups.includes(group);
              // FIX: Check if this is the last selected group and parent requires at least one
              const isLastSelected =
                isSelected && selectedGroups.length === 1 && isRestricted;

              return (
                <MenuItem
                  key={group}
                  value={group}
                  disabled={isLastSelected}
                  onClick={() => handleToggleGroup(group)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isLastSelected}
                    sx={{
                      color: '#002E6D',
                      '&.Mui-checked': {
                        color: '#4caf50',
                      },
                    }}
                  />
                  <ListItemText
                    primary={group}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isSelected ? 600 : 400,
                      },
                    }}
                  />
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

      {/* Warning box for no selection */}
      {selectedGroups.length === 0 && !isRestricted && (
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
              'documentManagement.studyGroups.noSelectionInfo',
              'No study groups selected. This folder will be public and visible to everyone.'
            )}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StudyGroupSelector;
