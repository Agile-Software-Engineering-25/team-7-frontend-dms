import React, { useEffect, useState } from 'react';
import { Box, Dialog, DialogContent, DialogActions } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Button from '@mui/joy/Button';

type FileViewerProps = {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
};

const FileViewer: React.FC<FileViewerProps> = ({
  open,
  onClose,
  fileUrl,
  fileName,
  fileType,
}) => {
  const { t } = useTranslation();
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileType?.startsWith('text/') && fileUrl) {
      fetch(fileUrl)
        .then((response) => response.text())
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('Failed to load text content.'));
    } else {
      setTextContent(null);
    }
  }, [open, fileType, fileUrl]);

  const handleDownload = () => {
    if (!fileUrl || !fileName) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const renderPreview = () => {
    // console.log("renderPreview called with:", { fileUrl, fileType, fileName });
    if (!fileUrl || !fileType) return null;

    if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          title="PDF preview"
        />
      );
    }

    if (fileType.startsWith('image/')) {
      return (
        <Box display="flex" justifyContent={'center'}>
          <img
            src={fileUrl}
            alt={fileName ?? 'preview'}
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('text/')) {
      return (
        <pre
          style={{
            maxHeight: '80vh',
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '1rem',
          }}
        >
          {textContent || 'Loading...'}
        </pre>
      );
    }

    return (
      <p>
        {t(
          'documentManagement.fileViewer.noPreview',
          'Keine Vorschau verfügbar für'
        )}
        {fileType}
      </p>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogContent dividers>{renderPreview()}</DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={handleDownload}
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
        >
          {t('documentManagement.fileViewer.download', 'Download')}
        </Button>
        <Button
          onClick={onClose}
          variant="plain"
          color="primary"
          sx={{
            '--Button-radius': '8px',
            '--Button-shadow': 'none',
            '--Button-hoverShadow': 'none',
          }}
        >
          {t('documentManagement.fileViewer.close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileViewer;
