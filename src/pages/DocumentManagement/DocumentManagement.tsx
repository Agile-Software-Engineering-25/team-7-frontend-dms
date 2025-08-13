import * as React from 'react';
import { Box, Typography } from '@mui/material';
import Button from '@shared-components/Button/Button';
import Card from '@shared-components/Card/Card';

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  padding: 3,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const Sidebar: React.FC = () => (
  <Box sx={{ width: 240, background: '#2f3b52', color: '#fff', padding: 2 }}>
    <Typography variant="h6" sx={{ marginBottom: 2 }}>
      DMS
    </Typography>
    {/* Add sidebar navigation here */}
  </Box>
);

const ActionButtons: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
    <Button variant="solid" color="primary" size="md">
      Upload
    </Button>
    <Button variant="solid" color="primary" size="md">
      Download
    </Button>
  </Box>
);

const Breadcrumb: React.FC = () => (
  <Box sx={{ marginBottom: 2 }}>
    <Typography variant="body2" sx={{ color: '#555', fontWeight: 500 }}>
      Home / Documents / Current Folder
    </Typography>
  </Box>
);

const DocumentManagement: React.FC = () => (
  <Box sx={{ display: 'flex', height: '100vh', background: '#f4f6fa' }}>
    <Sidebar />
    <Box
      sx={{
        flex: 1,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: 4 }}>
        Document Management
      </Typography>
      <ActionButtons />
      <Breadcrumb />
      <Card
        title="File Explorer"
        variant="outlined"
        size="lg"
        color="neutral"
        sx={fileExplorerCardStyles}
      >
        {/* Big canvas for file explorer */}
      </Card>
    </Box>
  </Box>
);

export default DocumentManagement;
