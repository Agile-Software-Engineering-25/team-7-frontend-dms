import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
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
  // Track previous fileUrl to differentiate between same file reopening vs new file
  const prevFileUrlRef = useRef<string | null>(null);
  const isLoading = loading ?? internalLoading;

  // Set loading BEFORE first paint when a new file starts loading to avoid late flicker.
  useLayoutEffect(() => {
    if (!open) return;
    // New file selected or newly opened
    const isNewFile = fileUrl && prevFileUrlRef.current !== fileUrl;
    if (isNewFile) {
      prevFileUrlRef.current = fileUrl;
      setTextContent(null); // reset any previous text content
      setInternalLoading(true);
      setLoading?.(true);
    }
  }, [open, fileUrl, setLoading]);

  // If dialog was closed, reset loading refs
  useEffect(() => {
    if (!open) {
      setInternalLoading(false);
    }
  }, [open]);

  // Load text content for text files
  useEffect(() => {
    if (open && fileType?.startsWith('text/') && fileUrl) {
      // Remove fragment identifier for fetch
      const cleanUrl = fileUrl.split('#')[0];
      // Ensure loading state (in case same URL triggers refetch)
      setInternalLoading(true);
      setLoading?.(true);
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
    // Be explicit: allow images, allowed list, convertible list.
    // Do NOT generally allow text/* to avoid odd HTML/CSV rendering.
    if (ALLOWED_PREVIEW_TYPES.includes(type)) return true;
    if (CONVERTIBLE_TYPES.includes(type)) return true;
    if (type.startsWith('image/')) return true;
    return false;
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
              'No preview available'
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              'documentManagement.fileViewer.unsupportedType',
              'File type not supported:'
            )}{' '}
            {fileType}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t(
              'documentManagement.fileViewer.downloadInstead',
              'Please download the file to open it.'
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
                {t('documentManagement.viewer.loading', 'Loading preview...')}
              </Typography>
            </Box>
          )}
          {/* Hide iframe visually until loaded to reduce layout jank */}
          <iframe
            src={fileUrl}
            style={{
              width: '100%',
              height: '80vh',
              border: 'none',
              visibility: isLoading ? 'hidden' : 'visible',
            }}
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
                {t('documentManagement.viewer.loading', 'Loading preview...')}
              </Typography>
            </Box>
          )}
          <img
            src={fileUrl}
            alt={fileName ?? 'preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              visibility: isLoading ? 'hidden' : 'visible',
            }}
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
                {t('documentManagement.viewer.loading', 'Loading preview...')}
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
              opacity: isLoading ? 0.3 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {textContent ||
              t('documentManagement.viewer.loading', 'Loading preview...')}
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
        {t('documentManagement.fileViewer.preview', 'Preview of:')} {fileName}
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
