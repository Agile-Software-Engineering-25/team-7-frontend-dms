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
  onOpen?: (id: string) => void;
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
}) => {
  return (
    <ListItem
      component="div"
      divider
      role="listitem"
      onClick={() => item.itemType === 'folder' && onOpen?.(item.id)}
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
      <FileItemActions
        itemId={item.id}
        itemName={item.name}
        onRename={() => onRename(item.id)}
        onDelete={() => onDelete(item.id)}
      />
    </ListItem>
  );
};

export default FileListItem;
