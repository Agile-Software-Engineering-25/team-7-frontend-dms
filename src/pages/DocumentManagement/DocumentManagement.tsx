import * as React from 'react';
import { Box, Card, CardContent, CardHeader } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FileExplorer from './FileExplorer';

const fileExplorerCardStyles = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 12,
  backgroundColor: '#eef3f9',
  boxShadow: 'none',
  border: 'none',
};

// Action buttons are rendered inside the FileExplorer for local handlers

// BreadcrumbBar extracted to ./BreadcrumbBar

const DocumentManagement: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', height: '100vh', background: 'white' }}>
      <Box
        sx={{
          flex: 1,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* ActionButtons and breadcrumb rendered inside FileExplorer to access state handlers */}
        <Card sx={fileExplorerCardStyles}>
          <CardHeader
            titleTypographyProps={{
              variant: 'h4',
              sx: {
                fontWeight: 700,
                color: '#000000',
              },
            }}
            title={t('documentManagement.title', 'Document Management')}
            sx={{ px: 4, pt: 4, pb: 2, mb: 1 }}
          />
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              px: 4,
              pb: 3,
              pt: 0,
            }}
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
