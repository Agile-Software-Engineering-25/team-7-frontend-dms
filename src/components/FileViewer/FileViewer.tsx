import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Button from '@mui/joy/Button';
import useDmsApiSelector from '@hooks/useDmsApiSelector';

type FileViewerProps = {
  open: boolean;
  onClose: () => void;
  fileId?: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  loading?: boolean;
  setLoading?: (v: boolean) => void;
};

// Allowed file types for preview
const ALLOWED_PREVIEW_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'text/plain',
];

// File types that need conversion (will be converted to PDF by backend)
const CONVERTIBLE_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
];

const FileViewer: React.FC<FileViewerProps> = ({
  open,
  onClose,
  fileId,
  fileUrl,
  fileName,
  fileType,
  loading,
  setLoading,
}) => {
  const { t } = useTranslation();
  const api = useDmsApiSelector();
  const [textContent, setTextContent] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading ?? internalLoading;

  // Reset loading state when dialog opens with new file
  useEffect(() => {
    if (open && fileUrl) {
      setInternalLoading(true);
      setTextContent(null);
    }
  }, [open, fileUrl]);

  // Load text content for text files
  useEffect(() => {
    if (open && fileType?.startsWith('text/') && fileUrl) {
      // Remove fragment identifier for fetch
      const cleanUrl = fileUrl.split('#')[0];
      fetch(cleanUrl)
        .then((response) => response.text())
        .then((text) => {
          setTextContent(text);
          setInternalLoading(false);
          setLoading?.(false);
        })
        .catch(() => {
          setTextContent('Failed to load text content.');
          setInternalLoading(false);
          setLoading?.(false);
        });
    }
  }, [open, fileType, fileUrl, setLoading]);

  const handleDownload = async () => {
    try {
      if (!fileId) return;

      const isConvertedPdf =
        fileType === 'application/pdf' && fileName?.startsWith('converted-');

      if (isConvertedPdf) {
        const { url, name } = await api.downloadDocument(fileId);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
      } else {
        const link = document.createElement('a');
        // Remove fragment identifier for download
        const cleanUrl = fileUrl?.split('#')[0];
        link.href = cleanUrl!;
        link.download = fileName ?? 'file';
        link.click();
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const canPreview = (type: string | null): boolean => {
    if (!type) return false;
    return (
      ALLOWED_PREVIEW_TYPES.includes(type) ||
      CONVERTIBLE_TYPES.includes(type) ||
      type.startsWith('image/') ||
      type.startsWith('text/')
    );
  };

  const renderPreview = () => {
    if (!fileUrl || !fileType) return null;

    // Check if file type is supported
    if (!canPreview(fileType)) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {t(
              'documentManagement.fileViewer.noPreview',
              'Keine Vorschau verfügbar'
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              'documentManagement.fileViewer.unsupportedType',
              'Dateityp wird nicht unterstützt:'
            )}{' '}
            {fileType}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t(
              'documentManagement.fileViewer.downloadInstead',
              'Bitte laden Sie die Datei herunter, um sie zu öffnen.'
            )}
          </Typography>
        </Box>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <Box sx={{ position: 'relative', height: '80vh' }}>
          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.95)',
                zIndex: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography sx={{ mt: 2 }}>
                {t(
                  'documentManagement.viewer.loading',
                  'Vorschau wird erstellt...'
                )}
              </Typography>
            </Box>
          )}
          <iframe
            src={fileUrl}
            style={{ width: '100%', height: '80vh', border: 'none' }}
            title="PDF Preview"
            onLoad={() => {
              setLoading?.(false);
              setInternalLoading(false);
            }}
            onError={() => {
              setLoading?.(false);
              setInternalLoading(false);
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('image/')) {
      return (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.95)',
                zIndex: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography sx={{ mt: 2 }}>
                {t(
                  'documentManagement.viewer.loading',
                  'Vorschau wird erstellt...'
                )}
              </Typography>
            </Box>
          )}
          <img
            src={fileUrl}
            alt={fileName ?? 'preview'}
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
            onLoad={() => {
              setLoading?.(false);
              setInternalLoading(false);
            }}
            onError={() => {
              setLoading?.(false);
              setInternalLoading(false);
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith('text/')) {
      return (
        <Box sx={{ position: 'relative' }}>
          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexDirection="column"
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.95)',
                zIndex: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography sx={{ mt: 2 }}>
                {t(
                  'documentManagement.viewer.loading',
                  'Vorschau wird erstellt...'
                )}
              </Typography>
            </Box>
          )}
          <pre
            style={{
              maxHeight: '80vh',
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              margin: 0,
            }}
          >
            {textContent || 'Loading...'}
          </pre>
        </Box>
      );
    }

    return null;
  };

  if (!fileName)
    fileName = t('documentManagement.fileViewer.unknownFile', 'Unknown File');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {t('documentManagement.fileViewer.preview', 'Vorschau von:')} {fileName}
      </DialogTitle>
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
