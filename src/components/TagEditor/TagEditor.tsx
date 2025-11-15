import * as React from 'react';
import {
  Box,
  Chip,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
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

  const handleChange = async (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedUuids = typeof value === 'string' ? value.split(',') : value;

    // Check if a new tag needs to be created
    const newTagName = selectedUuids.find(
      (uuid) => !availableTags.some((tag) => tag.uuid === uuid)
    );

    if (
      newTagName &&
      typeof newTagName === 'string' &&
      newTagName.startsWith('__new__:')
    ) {
      const tagName = newTagName.replace('__new__:', '');
      try {
        const newTag = await createTag(tagName);
        const otherSelectedTags = availableTags.filter((tag) =>
          selectedUuids.includes(tag.uuid)
        );
        setSelectedTags([...otherSelectedTags, newTag]);
      } catch (error) {
        console.error('Failed to create tag:', error);
      }
    } else {
      const newSelectedTags = availableTags.filter((tag) =>
        selectedUuids.includes(tag.uuid)
      );
      setSelectedTags(newSelectedTags);
    }
  };

  const handleDelete = (tagToDelete: TagEntity) => {
    setSelectedTags(
      selectedTags.filter((tag) => tag.uuid !== tagToDelete.uuid)
    );
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault();
      const tagExists = availableTags.some(
        (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
      );

      if (!tagExists) {
        createTag(inputValue.trim())
          .then((newTag) => {
            setSelectedTags([...selectedTags, newTag]);
            setInputValue('');
          })
          .catch((error) => {
            console.error('Failed to create tag:', error);
          });
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: '#ffffff' }}>
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

          {/* Add Tags Section */}
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, fontWeight: 600, color: '#002E6D' }}
          >
            {t('documentManagement.tagging.addTags', 'Add Tags')}
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="tag-select-label">
              {t('documentManagement.tagging.selectLabel', 'Select Tags')}
            </InputLabel>
            <Select
              labelId="tag-select-label"
              id="tag-select"
              multiple
              value={selectedTags.map((tag) => tag.uuid)}
              onChange={handleChange}
              disabled={saving || loading}
              input={
                <OutlinedInput
                  label={t(
                    'documentManagement.tagging.selectLabel',
                    'Select Tags'
                  )}
                  onKeyDown={handleInputKeyDown}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              }
              renderValue={() => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTags.map((tag) => (
                    <Chip
                      key={tag.uuid}
                      label={tag.name}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(tag);
                      }}
                      disabled={saving}
                      sx={{
                        backgroundColor: '#002E6D',
                        color: '#ffffff',
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: '#ffffff',
                          },
                          pointerEvents: 'auto',
                        },
                        '&.Mui-disabled': {
                          opacity: 0.6,
                          backgroundColor: '#002E6D',
                          color: '#ffffff',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {loading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('documentManagement.tagging.loading', 'Loading tags...')}
                </MenuItem>
              ) : availableTags.length === 0 ? (
                <MenuItem disabled>
                  {t('documentManagement.tagging.noTags', 'No tags available')}
                </MenuItem>
              ) : (
                availableTags.map((tag) => {
                  const isSelected = selectedTags.some(
                    (t) => t.uuid === tag.uuid
                  );

                  return (
                    <MenuItem key={tag.uuid} value={tag.uuid}>
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
                        primary={tag.name}
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {t(
                'documentManagement.tagging.tutorial',
                'Type a tag here and press enter to create a new tag'
              )}
            </Typography>
          </FormControl>

          {/* Warning box for no selection */}
          {selectedTags.length >= 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                <strong>
                  {t('documentManagement.tagging.hintTitle', 'Note')}
                </strong>
                <br />
                {t(
                  'documentManagement.tagging.hintContent1',
                  'This folder can only be assigned to student groups that are also assigned to its parent folder.'
                )}
                <br />
                {t(
                  'documentManagement.tagging.hintContent2',
                  'There has to be at least one student group assigned.'
                )}
              </Typography>
            </Box>
          )}
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
