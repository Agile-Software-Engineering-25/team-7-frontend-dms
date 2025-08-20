import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Card from '@shared-components/Card/Card';
import FileExplorer from './FileExplorer';

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  padding: 3,
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
        <Card
          title={t('documentManagement.fileExplorer', 'File Explorer')}
          variant="outlined"
          size="lg"
          color="neutral"
          sx={fileExplorerCardStyles}
        >
          {/* File explorer list with accessible actions */}
          <FileExplorer />
        </Card>
      </Box>
    </Box>
  );
};
export default DocumentManagement;
