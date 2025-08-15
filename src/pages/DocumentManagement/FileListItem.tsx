import * as React from 'react';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
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

const FileListItem: React.FC<Props> = ({ item, onRename, onDelete }) => {
  return (
    <ListItem
      key={item.id}
      divider
      role="listitem"
      sx={{ alignItems: 'center' }}
    >
      <ListItemAvatar>
        <Avatar aria-hidden>
          {item.itemType === 'folder'
            ? '📁'
            : item.itemType === 'pdf'
              ? '📄'
              : '📎'}
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
            <Typography component="span" sx={{ fontWeight: 600 }}>
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
