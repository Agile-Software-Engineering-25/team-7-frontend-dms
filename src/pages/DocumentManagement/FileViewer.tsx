import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { parseFolderMetadata } from './folderMetadata';
import Button from '@shared-components/Button/Button';

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
    const [textContent, setTextContent] = useState<string | null>(null);

    useEffect(() => {
        if (open && fileType?.startsWith("text/") && fileUrl) {
            fetch(fileUrl)
                .then(response => response.text())
                .then(text => setTextContent(text))
                .catch(() => setTextContent("Failed to load text content."));
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
        if (!fileUrl || !fileType) return null;

        if (fileType === 'application/pdf') {
            return (
                <iframe
                    src={fileUrl}
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                    title='PDF preview'
                />
            );
        }

        if (fileType.startsWith('image/')) {
            return (
                <Box display='flex' justifyContent={'center'}>
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

        return <p>Keine Vorschau verfügbar für {fileType}</p>;
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogContent>{renderPreview()}</DialogContent>
            <DialogActions>
                <Button onClick={handleDownload}>Download</Button>
                <Button onClick={onClose} color='primary'>Schließen</Button>
            </DialogActions>
        </Dialog>
    );
};

export default FileViewer;