import React from 'react';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import type { TagEntity } from '@/@types/fileExplorer';

interface TagActionButtonsProps {
  tag: TagEntity;
  onEdit?: (tag: TagEntity, event: React.MouseEvent) => void;
  onDelete?: (tag: TagEntity, event: React.MouseEvent) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export const TagActionButtons: React.FC<TagActionButtonsProps> = ({
  tag,
  onEdit,
  onDelete,
  isSelected = false,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const getEditButtonStyles = () => ({
    padding: '2px',
    borderRadius: '100%',
    border: `1px solid ${
      isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 46, 109, 0.3)'
    }`,
    backgroundColor: 'transparent',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    '&:hover': {
      backgroundColor: isSelected ? 'transparent' : 'rgba(0, 46, 109, 0.08)',
      borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : '#002E6D',
    },
    '&.Mui-disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  });

  const getDeleteButtonStyles = () => ({
    padding: '2px',
    borderRadius: '50%',
    border: `1px solid ${
      isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(211, 47, 47, 0.3)'
    }`,
    backgroundColor: 'transparent',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    '&:hover': {
      backgroundColor: isSelected ? 'transparent' : 'rgba(211, 47, 47, 0.08)',
      borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : '#d32f2f',
    },
    '&.Mui-disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 0.5,
        ml: 1,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {onEdit && (
        <IconButton
          onClick={(e) => onEdit(tag, e)}
          disabled={disabled || isSelected}
          sx={getEditButtonStyles()}
          aria-label={t('documentManagement.tagging.editTag', 'Tag bearbeiten')}
        >
          <EditIcon
            sx={{
              fontSize: '16px',
              color: isSelected ? '#ffffff' : '#002E6D',
            }}
          />
        </IconButton>
      )}
      {onDelete && (
        <IconButton
          onClick={(e) => onDelete(tag, e)}
          disabled={disabled || isSelected}
          sx={getDeleteButtonStyles()}
          aria-label={t('documentManagement.tagging.deleteTag', 'Tag löschen')}
        >
          <DeleteIcon
            sx={{
              fontSize: '16px',
              color: isSelected ? '#ffffff' : '#d32f2f',
            }}
          />
        </IconButton>
      )}
    </Box>
  );
};

export default TagActionButtons;
