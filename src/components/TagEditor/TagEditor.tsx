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
  Select,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import Button from '@mui/joy/Button';
import type { TagEntity } from '@/@types/fileExplorer';
import { useTranslation } from 'react-i18next';
import useTags from '@hooks/useTags';
import AddTagDialog from '@components/AddTagDialog/AddTagDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  currentTags: TagEntity[];
  onSave: (tagUuids: string[]) => Promise<void>;
  onTagsChanged?: () => Promise<void>; // Add this callback
};

const TagEditor: React.FC<Props> = ({
  open,
  onClose,
  documentName,
  currentTags,
  onSave,
  onTagsChanged, // Receive the callback
}) => {
  const { tags: availableTags, loading, fetchTags } = useTags();
  const [selectedTags, setSelectedTags] = React.useState<TagEntity[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = React.useState(false);
  const { t } = useTranslation();

  // Initialize selected tags when dialog opens or currentTags change
  React.useEffect(() => {
    if (open) {
      // Refresh tags from server when dialog opens
      fetchTags();

      // Filter currentTags to only include tags that still exist
      // This handles the case where a tag was deleted while the dialog was closed
      const validTags = currentTags.filter((currentTag) =>
        availableTags.some(
          (availableTag) => availableTag.uuid === currentTag.uuid
        )
      );
      setSelectedTags(validTags);
    }
  }, [open, currentTags, fetchTags]);

  // Update selected tags when availableTags changes (e.g., after tag deletion)
  React.useEffect(() => {
    if (open) {
      // Remove any selected tags that no longer exist in availableTags
      setSelectedTags((prevSelected) =>
        prevSelected.filter((selectedTag) =>
          availableTags.some(
            (availableTag) => availableTag.uuid === selectedTag.uuid
          )
        )
      );
    }
  }, [availableTags, open]);

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

    const newSelectedTags = availableTags.filter((tag) =>
      selectedUuids.includes(tag.uuid)
    );
    setSelectedTags(newSelectedTags);
  };

  const handleDelete = (tagToDelete: TagEntity) => {
    setSelectedTags(
      selectedTags.filter((tag) => tag.uuid !== tagToDelete.uuid)
    );
  };

  // Handle when tags are added
  const handleAddTagConfirm = async (newTag: TagEntity) => {
    // Prevent duplicate tags (by uuid)
    if (!selectedTags.some((tag) => tag.uuid === newTag.uuid)) {
      setSelectedTags([...selectedTags, newTag]);
    }
    // Refetch tags to ensure the list is up-to-date
    await fetchTags();
    // Notify parent to refresh
    if (onTagsChanged) {
      await onTagsChanged();
    }
    setAddTagDialogOpen(false);
  };

  // Handle when tags are updated in AddTagDialog
  const handleTagsUpdated = async () => {
    await fetchTags();
    // Notify parent to refresh document list
    if (onTagsChanged) {
      await onTagsChanged();
    }
  };

  return (
    <>
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

            <FormControl fullWidth sx={{ mt: 1 }}>
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
                label={t(
                  'documentManagement.tagging.selectLabel',
                  'Select Tags'
                )}
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
                    {t(
                      'documentManagement.tagging.noTags',
                      'No tags available'
                    )}
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
            </FormControl>

            {/* Create New Tag Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setAddTagDialogOpen(true)}
                disabled={saving}
                variant="outlined"
                sx={{
                  '--Button-radius': '8px',
                  '--Button-shadow': 'none',
                  '--Button-hoverShadow': 'none',
                  '--Button-minHeight': '34px',
                  '--Button-paddingInline': '16px',
                  '--Button-borderColor': '#002E6D',
                  '--Button-color': '#002E6D',
                  '--Button-hoverBg': 'rgba(0, 46, 109, 0.08)',
                  fontWeight: 600,
                }}
              >
                {t(
                  'documentManagement.tagging.createNew',
                  'Neuen Tag erstellen'
                )}
              </Button>
            </Box>
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

      <AddTagDialog
        open={addTagDialogOpen}
        isProcessing={saving}
        onClose={() => setAddTagDialogOpen(false)}
        onConfirm={handleAddTagConfirm}
        onTagsUpdated={handleTagsUpdated} // Pass the callback
      />
    </>
  );
};

export default TagEditor;
