import * as React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { TagEntity } from '@/@types/fileExplorer';
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
      <DialogTitle>Manage Tags</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add or remove tags for: <strong>{documentName}</strong>
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
                placeholder="Type to search or create new tag..."
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
            Type a tag name and press Enter to create a new tag
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagEditor;
