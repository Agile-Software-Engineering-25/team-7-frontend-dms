import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import Button from '@mui/joy/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import useTags from '@hooks/useTags';
import ManageTagDialog from '@components/ManageTagDialog/ManageTagDialog';
import DeleteTagDialog from '@components/DeleteTagDialog/DeleteTagDialog';
import type { TagEntity } from '@/@types/fileExplorer';

type AddTagDialogProps = {
  open: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (newTag: TagEntity) => void;
  onTagsUpdated?: () => Promise<void>;
};

const AddTagDialog: React.FC<AddTagDialogProps> = ({
  open,
  isProcessing,
  onClose,
  onConfirm,
  onTagsUpdated, // NEW
}) => {
  const { t } = useTranslation();
  const {
    tags: availableTags,
    createTag,
    fetchTags,
    updateTag,
    deleteTag,
  } = useTags();
  const [tagName, setTagName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<TagEntity | null>(null);
  const [managingTag, setManagingTag] = React.useState(false);

  // Refresh tags when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  const handleConfirm = async () => {
    const name = tagName.trim();
    if (!name) return;
    // Prevent duplicate tags (case-insensitive)
    const exists = availableTags.some(
      (tag) => tag.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setTagName('');
      return;
    }
    setCreating(true);
    try {
      const newTag = await createTag(name);
      await fetchTags(); // Refetch tags after create
      onConfirm(newTag);
      setTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating && !isProcessing && !managingTag) {
      setTagName('');
      onClose();
    }
  };

  const handleEditClick = (tag: TagEntity, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (tag: TagEntity, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleEditConfirm = async (newName: string) => {
    if (!selectedTag) return;
    setManagingTag(true);
    try {
      await updateTag(selectedTag.uuid, newName);
      await fetchTags(); // Refetch tags after update
      if (onTagsUpdated) {
        await onTagsUpdated();
      }
      setEditDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setManagingTag(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;
    setManagingTag(true);
    try {
      await deleteTag(selectedTag.uuid);
      await fetchTags(); // Refetch tags after delete
      if (onTagsUpdated) {
        await onTagsUpdated();
      }
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    } finally {
      setManagingTag(false);
    }
  };

  // Check if the entered tag already exists (case-insensitive)
  const tagExists =
    !!tagName.trim() &&
    availableTags.some(
      (tag) => tag.name.toLowerCase() === tagName.trim().toLowerCase()
    );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="add-tag-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="add-tag-dialog-title">
        {t('documentManagement.tagging.addTagTitle', 'Create New Tag')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'documentManagement.tagging.newInstructions',
              'Create a new tag by entering its name below.'
            )}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t('documentManagement.tagging.tagName', 'Enter tag name')}
            type="text"
            fullWidth
            variant="outlined"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            disabled={creating || isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagName.trim() && !tagExists) {
                handleConfirm();
              }
            }}
            sx={{ mb: 2 }}
            error={Boolean(tagExists)}
            helperText={
              tagExists
                ? t(
                    'documentManagement.tagging.duplicateTag',
                    'Tag already exists.'
                  )
                : ''
            }
          />
          <Box
            sx={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid #eee',
              borderRadius: 1,
              p: 1,
              background: '#fafbfc',
            }}
          >
            {availableTags
              .filter((tag) =>
                tag.name.toLowerCase().includes(tagName.toLowerCase())
              )
              .map((tag) => (
                <Box
                  key={tag.uuid}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 46, 109, 0.08)',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#002E6D',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}
                  >
                    {tag.name}
                  </Typography>
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
                    <IconButton
                      onClick={(e) => handleEditClick(tag, e)}
                      sx={{
                        padding: '2px',
                        borderRadius: '100%',
                        border: '1px solid rgba(0, 46, 109, 0.3)',
                        backgroundColor: 'transparent',
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 46, 109, 0.08)',
                          borderColor: '#002E6D',
                        },
                      }}
                      aria-label={t(
                        'documentManagement.tagging.editTag',
                        'Edit tag'
                      )}
                    >
                      <EditIcon sx={{ fontSize: '16px', color: '#002E6D' }} />
                    </IconButton>
                    <IconButton
                      onClick={(e) => handleDeleteClick(tag, e)}
                      sx={{
                        padding: '2px',
                        borderRadius: '50%',
                        border: '1px solid rgba(211, 47, 47, 0.3)',
                        backgroundColor: 'transparent',
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                          borderColor: '#d32f2f',
                        },
                      }}
                      aria-label={t(
                        'documentManagement.tagging.deleteTag',
                        'Delete tag'
                      )}
                    >
                      <DeleteIcon sx={{ fontSize: '16px', color: '#d32f2f' }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            {availableTags.filter((tag) =>
              tag.name.toLowerCase().includes(tagName.toLowerCase())
            ).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                {t('documentManagement.tagging.noTags', 'No tags available')}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleConfirm}
          disabled={creating || isProcessing || !tagName.trim() || tagExists}
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
          {t('documentManagement.tagging.add', 'Hinzufügen')}
        </Button>
        <Button
          onClick={handleClose}
          disabled={creating || isProcessing}
          variant="plain"
          color="primary"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.tagging.cancel', 'Abbrechen')}
        </Button>
      </DialogActions>

      <ManageTagDialog
        open={editDialogOpen}
        tag={selectedTag}
        isProcessing={managingTag}
        onClose={() => setEditDialogOpen(false)}
        onConfirm={handleEditConfirm}
      />

      <DeleteTagDialog
        open={deleteDialogOpen}
        tag={selectedTag}
        isProcessing={managingTag}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Dialog>
  );
};

export default AddTagDialog;
