import * as React from 'react';
import { Box, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileExplorer from './FileExplorer';

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ width: 240, background: '#2f3b52', color: '#fff', padding: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        {t('documentManagement.sidebarTitle', 'DMS')}
      </Typography>
      {/* Add sidebar navigation here */}
    </Box>
  );
};

// Action buttons are rendered inside the FileExplorer for local handlers

// BreadcrumbBar extracted to ./BreadcrumbBar

const DocumentManagement: React.FC = () => {
  const { t } = useTranslation();
  return (
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
          {t('documentManagement.title', 'Document Management')}
        </Typography>
        {/* ActionButtons and breadcrumb rendered inside FileExplorer to access state handlers */}
        <Card variant="outlined" sx={fileExplorerCardStyles}>
          <CardHeader
            title={t('documentManagement.fileExplorer', 'File Explorer')}
            sx={{ px: 3, py: 2 }}
          />
          <CardContent
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, pt: 0 }}
          >
            {/* File explorer list with accessible actions */}
            <FileExplorer />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
export default DocumentManagement;
