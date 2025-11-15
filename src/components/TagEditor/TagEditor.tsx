import * as React from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import Button from '@mui/joy/Button';
import type { TagEntity } from '@/@types/fileExplorer';
import { useTranslation } from 'react-i18next';
import useTags from '@hooks/useTags';

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  currentTags: TagEntity[];
  onSave: (tagUuids: string[]) => Promise<void>;
};

const TagEditor: React.FC<Props> = ({
  open,
  onClose,
  documentName,
  currentTags,
  onSave,
}) => {
  const { tags: availableTags, loading, createTag } = useTags();
  const [selectedTags, setSelectedTags] = React.useState<TagEntity[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const { t } = useTranslation();

  // Initialize selected tags when dialog opens or currentTags change
  React.useEffect(() => {
    if (open) {
      setSelectedTags(currentTags);
    }
  }, [open, currentTags]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagUuids = selectedTags.map((tag) => tag.uuid);
      await onSave(tagUuids);
      onClose();
    } catch (error) {
      console.error('Failed to save tags:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTagChange = async (
    _event: React.SyntheticEvent,
    value: (string | TagEntity)[],
    reason: string
  ) => {
    // Handle creating new tags
    if (reason === 'createOption') {
      const newTagNames = value.filter(
        (v): v is string => typeof v === 'string'
      );

      if (newTagNames.length > 0) {
        try {
          // Create new tags
          const newTags: TagEntity[] = [];
          for (const tagName of newTagNames) {
            const newTag = await createTag(tagName);
            newTags.push(newTag);
          }

          // Add existing TagEntity objects
          const existingTags = value.filter(
            (v): v is TagEntity => typeof v !== 'string'
          );

          setSelectedTags([...existingTags, ...newTags]);
        } catch (error) {
          console.error('Failed to create tag:', error);
        }
      }
    } else {
      // Normal selection
      setSelectedTags(value as TagEntity[]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('documentManagement.tagging.manage', 'Manage Tags')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'documentManagement.tagging.instructions',
              'Add or remove tags for: '
            )}{' '}
            <strong>{documentName}</strong>
          </Typography>

          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={selectedTags}
            onChange={handleTagChange}
            inputValue={inputValue}
            onInputChange={(_event, newInputValue) =>
              setInputValue(newInputValue)
            }
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.name
            }
            isOptionEqualToValue={(option, value) =>
              typeof option !== 'string' &&
              typeof value !== 'string' &&
              option.uuid === value.uuid
            }
            loading={loading}
            disabled={saving}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tag = typeof option === 'string' ? option : option.name;
                return (
                  <Chip
                    label={tag}
                    size="small"
                    {...getTagProps({ index })}
                    key={typeof option === 'string' ? option : option.uuid}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder={t(
                  'documentManagement.tagging.tagPlaceholder',
                  'Type to search or create new tag...'
                )}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li
                {...props}
                key={typeof option === 'string' ? option : option.uuid}
              >
                {typeof option === 'string' ? option : option.name}
              </li>
            )}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {t(
              'documentManagement.tagging.tutorial',
              'Type a tag here and press enter to create a new tag'
            )}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSave}
          disabled={saving}
          startDecorator={saving ? <CircularProgress size={16} /> : null}
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
          {t('documentManagement.tagging.save', 'Save')}
        </Button>
        <Button
          onClick={onClose}
          disabled={saving}
          variant="plain"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.tagging.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagEditor;
