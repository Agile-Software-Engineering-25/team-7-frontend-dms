import * as React from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
} from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/FileDownload';
import Button from '@mui/joy/Button';
import { useTranslation } from 'react-i18next';
import type { TagEntity } from '@/@types/fileExplorer';

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
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      <TextField
        size="small"
        placeholder={t('documentManagement.search.searchPlaceholder', 'search')}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          'aria-label': t(
            'documentManagement.search.searchbar',
            'searching in current folder'
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
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.name}
                size="small"
                {...getTagProps({ index })}
                key={option.uuid}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t(
                'documentManagement.filter.tagPlaceholder',
                'Filter by tags...'
              )}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <FilterListIcon
                        fontSize="medium"
                        sx={{ color: '#002E6D' }}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{
            minWidth: { xs: '100%', md: 200 },
            maxWidth: { xs: '100%', md: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              backgroundColor: '#ffffff',
              minHeight: 40,
              '& fieldset': { borderColor: '#d1d9e6' },
              '&:hover fieldset': { borderColor: '#002E6D' },
              '&.Mui-focused fieldset': { borderColor: '#002E6D' },
            },
          }}
        />
      )}
      <Box sx={{ flexGrow: 1 }} />
      {canUpload && (
        <Button
          size="sm"
          aria-label={t(
            'documentManagement.uploadDocuemnt.button',
            'Upload document'
          )}
          aria-describedby={t(
            'documentManagement.uploadDocument.maxSize',
            'Max size of a file: X MB'
          )}
          variant="solid"
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
          {t('documentManagement.uploadDocument.button', 'Upload document')}
        </Button>
      )}
      <Button
        size="sm"
        aria-label={t(
          'documentManagement.downloadDocument.button',
          'Download documents'
        )}
        aria-describedby={t(
          'documentManagement.downloadDocument.description',
          'Downloads every document in current directory'
        )}
        variant="solid"
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
        {t('documentManagement.downloadDocument.button', 'Download documents')}
      </Button>
      {canManage && (
        <IconButton
          aria-label={t('documentManagement.newFolder.title', 'Create folder')}
          title={t('documentManagement.newFolder.title', 'Create folder')}
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
  );
};

export default FileExplorerToolbar;
