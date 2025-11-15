import * as React from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
} from '@mui/material';
import Button from '@mui/joy/Button';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/FileDownload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import type { TagEntity } from '@/@types/fileExplorer';
import DeleteTagDialog from '../DeleteTagDialog/DeleteTagDialog';
import ManageTagDialog from '../ManageTagDialog/ManageTagDialog';
import { useCanAccess } from '@/lib/permissions';

type FileExplorerToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  onDownloadClick: () => void;
  onCreateFolderClick: () => void;
  canUpload: boolean;
  canManage: boolean;
  availableTags?: TagEntity[];
  selectedTags?: TagEntity[];
  onTagFilterChange?: (tags: TagEntity[]) => void;
  onRefetchTags?: () => void;
  onDeleteTag?: (tagUuid: string) => Promise<void>;
  onUpdateTag?: (tagUuid: string, newName: string) => Promise<TagEntity>;
};

const FileExplorerToolbar: React.FC<FileExplorerToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onUploadClick,
  onDownloadClick,
  onCreateFolderClick,
  canUpload,
  canManage,
  availableTags = [],
  selectedTags = [],
  onTagFilterChange,
  onRefetchTags,
  onDeleteTag,
  onUpdateTag,
}) => {
  const { t } = useTranslation();
  const { canAccess } = useCanAccess();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<TagEntity | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const canManageDocuments = canAccess('manageDocuments');

  const handleDeleteClick = (tag: TagEntity, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (tag: TagEntity, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTag(tag);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag || !onDeleteTag) return;

    setIsProcessing(true);
    try {
      await onDeleteTag(selectedTag.uuid);
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditConfirm = async (newName: string) => {
    if (!selectedTag || !onUpdateTag) return;

    setIsProcessing(true);
    try {
      await onUpdateTag(selectedTag.uuid, newName);
      setEditDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDialogClose = () => {
    if (!isProcessing) {
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedTag(null);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          flexWrap: 'nowrap',
        }}
      >
        <TextField
          size="small"
          placeholder={t(
            'documentManagement.search.searchPlaceholder',
            'Suche'
          )}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            'aria-label': t(
              'documentManagement.search.searchbar',
              'Suche im aktuellen Ordner'
            ),
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="medium" sx={{ color: '#002E6D' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: '100%', md: 240 },
            maxWidth: { xs: '100%', md: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              backgroundColor: '#ffffff',
              minHeight: 40,
              alignItems: 'center',
              '& fieldset': { borderColor: '#d1d9e6' },
              '&:hover fieldset': { borderColor: '#002E6D' },
              '&.Mui-focused fieldset': { borderColor: '#002E6D' },
            },
          }}
        />
        {onTagFilterChange && (
          <Autocomplete
            multiple
            size="small"
            options={availableTags}
            value={selectedTags}
            onChange={(_event, newValue) => onTagFilterChange(newValue)}
            onOpen={() => onRefetchTags?.()}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
            disableCloseOnSelect
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: { xs: '100%', md: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                height: 40,
                minHeight: 40,
                maxHeight: 40,
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                paddingRight: '8px',
                '& .MuiAutocomplete-input': {
                  padding: '0 8px',
                  minWidth: 30,
                },
                '& .MuiAutocomplete-endAdornment': {
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                },
                '& fieldset': { borderColor: '#d1d9e6' },
                '&:hover fieldset': { borderColor: '#002E6D' },
                '&.Mui-focused fieldset': { borderColor: '#002E6D' },
              },
            }}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              const isSelected = selectedTags.some(
                (tag) => tag.uuid === option.uuid
              );
              return (
                <li
                  key={key}
                  {...otherProps}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    backgroundColor: 'transparent',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#002E6D' : 'transparent',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: isSelected
                          ? '#001f56'
                          : 'rgba(17, 43, 215, 0.08)',
                      },
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.5',
                        color: isSelected ? '#ffffff' : 'inherit',
                        minWidth: 0,
                      }}
                    >
                      {option.name}
                    </span>
                    {canManageDocuments && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 0.5,
                          ml: 1,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 'auto',
                        }}
                      >
                        {onUpdateTag && (
                          <IconButton
                            onClick={(e) => handleEditClick(option, e)}
                            sx={{
                              padding: '2px',
                              borderRadius: '100%',
                              border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 46, 109, 0.3)'}`,
                              backgroundColor: 'transparent',
                              width: '24px',
                              height: '24px',
                              minWidth: '24px',
                              '&:hover': {
                                backgroundColor: isSelected
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 46, 109, 0.08)',
                                borderColor: isSelected ? '#ffffff' : '#002E6D',
                              },
                            }}
                            aria-label={t(
                              'documentManagement.tagging.editTag',
                              'Tag bearbeiten'
                            )}
                          >
                            <EditIcon
                              sx={{
                                fontSize: '16px',
                                color: isSelected ? '#ffffff' : '#002E6D',
                              }}
                            />
                          </IconButton>
                        )}
                        {onDeleteTag && (
                          <IconButton
                            onClick={(e) => handleDeleteClick(option, e)}
                            sx={{
                              padding: '2px',
                              borderRadius: '50%',
                              border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(211, 47, 47, 0.3)'}`,
                              backgroundColor: 'transparent',
                              width: '24px',
                              height: '24px',
                              minWidth: '24px',
                              '&:hover': {
                                backgroundColor: isSelected
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(211, 47, 47, 0.08)',
                                borderColor: isSelected ? '#ffffff' : '#d32f2f',
                              },
                            }}
                            aria-label={t(
                              'documentManagement.tagging.deleteTag',
                              'Tag löschen'
                            )}
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
                    )}
                  </Box>
                </li>
              );
            }}
            renderTags={(value, getTagProps) => {
              const maxVisibleTags = 1;
              const visibleTags = value.slice(0, maxVisibleTags);
              const hiddenCount = value.length - maxVisibleTags;

              return (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    width: 'auto',
                    overflow: 'hidden',
                    minWidth: 0,
                    maxWidth: '100%',
                    marginRight: 0.5,
                  }}
                >
                  {visibleTags.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        {...chipProps}
                        sx={{
                          maxWidth: '100px',
                          minWidth: 0,
                          height: '24px',
                          flexShrink: 1,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            padding: '0 8px',
                            display: 'block',
                            maxWidth: '100%',
                          },
                        }}
                      />
                    );
                  })}
                  {hiddenCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      +{hiddenCount}
                    </Box>
                  )}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t(
                  'documentManagement.tagging.filterPlaceholder',
                  'Filter nach Tags'
                )}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <FilterListIcon
                          fontSize="medium"
                          sx={{
                            color: '#002E6D',
                            paddingLeft: '8px',
                          }}
                        />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: '12px',
                  marginTop: '0px',
                  boxShadow: 'none',
                  backgroundColor: 'rgba(252, 252, 252, 0.8)',
                  border: 'none',
                  '& .MuiAutocomplete-listbox': {
                    borderRadius: '0px 0px 12px 12px',
                    padding: '8px 0',
                  },
                },
              },
            }}
            disableListWrap
            ListboxProps={{
              sx: {
                borderRadius: '0px 0px 12px 12px',
              },
            }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />
        {canUpload && (
          <Button
            size="sm"
            aria-label={t(
              'documentManagement.uploadDocument.button',
              'Datei hochladen'
            )}
            aria-describedby={t(
              'documentManagement.uploadDocument.maxSize',
              'Maximal 5 MB pro Datei'
            )}
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
            onClick={onUploadClick}
            startDecorator={<UploadIcon fontSize="small" />}
          >
            {t('documentManagement.uploadDocument.button', 'Datei hochladen')}
          </Button>
        )}
        <Button
          size="sm"
          aria-label={t(
            'documentManagement.downloadDocument.button',
            'Dateien herunterladen'
          )}
          aria-describedby={t(
            'documentManagement.downloadDocument.description',
            'Lädt jede Datei innerhalb des jetzigen Ordners herunter'
          )}
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
          onClick={onDownloadClick}
          startDecorator={<DownloadIcon fontSize="small" />}
        >
          {t(
            'documentManagement.downloadDocument.button',
            'Dateien herunterladen'
          )}
        </Button>
        {canManage && (
          <IconButton
            aria-label={t(
              'documentManagement.newFolder.title',
              'Ordner erstellen'
            )}
            title={t('documentManagement.newFolder.title', 'Ordner erstellen')}
            onClick={onCreateFolderClick}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#002E6D',
              color: '#ffffff',
              boxShadow: '0px 8px 18px rgba(0, 46, 109, 0.25)',
              '&:hover': {
                backgroundColor: '#001f56',
              },
            }}
          >
            <CreateNewFolderIcon fontSize="small" aria-hidden />
          </IconButton>
        )}
      </Box>

      <DeleteTagDialog
        open={deleteDialogOpen}
        tag={selectedTag}
        isProcessing={isProcessing}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
      />

      <ManageTagDialog
        open={editDialogOpen}
        tag={selectedTag}
        isProcessing={isProcessing}
        onClose={handleDialogClose}
        onConfirm={handleEditConfirm}
      />
    </>
  );
};

export default FileExplorerToolbar;
