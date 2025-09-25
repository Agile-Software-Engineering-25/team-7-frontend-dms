import * as React from 'react';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FileItemActions from './FileItemActions';

type Item = {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  itemType: 'folder' | 'document' | 'pdf' | 'other';
};

type Props = {
  item: Item;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onOpen?: (id: string) => void;
  onPreview?: (id: string) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
};

function formatSize(bytes: number) {
  if (bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

const FileListItem: React.FC<Props> = ({
  item,
  onRename,
  onDelete,
  onOpen,
  onPreview,
  onDrop,
  onDragOver,
  onDownload,
}) => {
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
      draggable
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
        <Avatar aria-hidden aria-label={item.itemType}>
          {item.itemType === 'folder' ? (
            <FolderIcon fontSize="small" aria-hidden />
          ) : item.itemType === 'pdf' ? (
            <DescriptionIcon fontSize="small" aria-hidden />
          ) : (
            <InsertDriveFileIcon fontSize="small" aria-hidden />
          )}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
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
              onClick={() => item.itemType === 'folder' && onOpen?.(item.id)}
              onKeyDown={(e) => {
                if (
                  item.itemType === 'folder' &&
                  (e.key === 'Enter' || e.key === ' ')
                ) {
                  e.preventDefault();
                  onOpen?.(item.id);
                }
              }}
            >
              {item.name}
            </Typography>
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
          onRename={() => onRename(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      </Box>
    </ListItem>
  );
};

export default FileListItem;
