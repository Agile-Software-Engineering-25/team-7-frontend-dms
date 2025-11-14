import * as React from 'react';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FileItemActions from '../FileItemActions/FileItemActions';
import { useCanAccess } from '@/lib/permissions';
import { formatSize, formatDate } from '@utils/formatters';
import type { TagEntity } from '@/@types/fileExplorer';

export type Item = {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  itemType: 'folder' | 'document' | 'pdf' | 'other';
  tags?: TagEntity[];
};

type Props = {
  item: Item;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onOpen?: (id: string, name: string) => void;
  onPreview?: (id: string) => void;
  onManageGroups?: () => void;
  onManageTags?: () => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
};

const FileListItem: React.FC<Props> = ({
  item,
  onRename,
  onDelete,
  onOpen,
  onPreview,
  onDrop,
  onDragOver,
  onDownload,
  onManageGroups,
  onManageTags,
}) => {
  const { canAccess } = useCanAccess();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  return (
    <ListItem
      component="div"
      divider
      role="listitem"
      draggable={canAccess('manageDocuments')}
      onClick={() => {
        if (item.itemType === 'folder' && canAccess('navigateFolders')) {
          onOpen?.(item.id, item.name);
        } else if (
          item.itemType === 'document' ||
          item.itemType === 'pdf' ||
          (item.itemType === 'other' && canAccess('viewDocuments'))
        ) {
          onPreview?.(item.id);
        }
      }}
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        try {
          e.dataTransfer?.setData(
            'application/x-dms-item',
            JSON.stringify({ id: item.id, type: item.itemType })
          );
          // show copy/move effect
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        } catch {
          // ignore
        }
      }}
      onDragEnd={() => {
        /* no-op for now */
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={onDrop}
      onDragOver={onDragOver}
      sx={{
        alignItems: 'center',
        transition: 'background-color 120ms ease, box-shadow 120ms ease',
        ...(isDragOver
          ? {
              backgroundColor: 'action.selected',
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}55`,
            }
          : {}),
      }}
    >
      <ListItemAvatar>
        <Avatar
          aria-hidden
          aria-label={item.itemType}
          sx={{
            width: 32,
            height: 32,
            color: '#002E6D',
            bgcolor: 'transparent',
          }}
        >
          {item.itemType === 'folder' ? (
            <FolderIcon fontSize="medium" aria-hidden />
          ) : item.itemType === 'pdf' ? (
            <DescriptionIcon fontSize="medium" aria-hidden />
          ) : (
            <InsertDriveFileIcon fontSize="medium" aria-hidden />
          )}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontWeight: 600,
                  cursor: item.itemType === 'folder' ? 'pointer' : 'default',
                }}
                role={item.itemType === 'folder' ? 'button' : undefined}
                tabIndex={item.itemType === 'folder' ? 0 : undefined}
                onClick={() => {
                  if (item.itemType === 'folder') {
                    onOpen?.(item.id, item.name);
                  } else if (onPreview) {
                    onPreview(item.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    item.itemType === 'folder' &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    onOpen?.(item.id, item.name);
                  }
                }}
              >
                {item.name}
              </Typography>
            </Box>
            {item.tags && item.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {item.tags.map((tag) => (
                  <Chip
                    key={tag.uuid}
                    label={tag.name}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      backgroundColor: '#E3F2FD',
                      color: '#1976D2',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 2, color: '#555' }}>
            <Typography component="span" variant="caption">
              {formatSize(item.size)}
            </Typography>
            <Typography component="span" variant="caption">
              {formatDate(item.uploadDate)}
            </Typography>
          </Box>
        }
      />
      <Box onClick={(e) => e.stopPropagation()}>
        <FileItemActions
          itemId={item.id}
          itemName={item.name}
          itemType={item.itemType}
          onRename={() => onRename(item.id)}
          onDelete={() => onDelete(item.id)}
          onDownload={() => onDownload(item.id)}
          onManageGroups={onManageGroups}
          onManageTags={onManageTags}
        />
      </Box>
    </ListItem>
  );
};

export default FileListItem;
