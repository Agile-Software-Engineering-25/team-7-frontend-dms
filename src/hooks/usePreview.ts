import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/@types/fileExplorer';
import useDmsApiSelector from '@hooks/useDmsApiSelector';

type UsePreviewProps = {
  items: Item[];
  showSnack: (msg: string, severity: 'success' | 'error' | 'info') => void;
};

/**
 * Custom hook for document preview and PDF conversion
 */
export function usePreview({ items, showSnack }: UsePreviewProps) {
  const api = useDmsApiSelector();
  const { t } = useTranslation();
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<{
    id: string;
    url: string;
    name: string;
    type: string | undefined;
  } | null>(null);

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewerFile(null);
    setViewerLoading(false);
  };

  const handleConvertOfficeToPdf = async (docId: string) => {
    try {
      const doc = items.find((i) => i.id === docId);
      if (!doc) return;

      // Reset state before opening
      setViewerFile(null);
      setViewerLoading(true);
      setViewerOpen(true);

      const isOfficeDoc = /\.(docx?|pptx?)$/i.test(doc.name);

      if (!isOfficeDoc) {
        // Regular file (PDF, image, text, etc.)
        const { url, name, type } = await api.downloadDocument(docId);
        // Add filename as fragment for display in iframe title
        const namedUrl = `${url}#${name}`;
        setViewerFile({ id: docId, url: namedUrl, name, type });
        // Loading will be set to false by onLoad event in FileViewer
      } else {
        // Office document - needs conversion
        const converted = await api.convertOfficeToPdf(docId);
        const blob = await fetch(converted.url).then((r) => r.blob());
        const blobUrl = URL.createObjectURL(blob);
        // Use original filename, not "converted-X.pdf"
        const namedUrl = `${blobUrl}#${doc.name}`;
        setViewerFile({
          id: docId,
          url: namedUrl,
          name: doc.name, // Use original document name
          type: converted.type,
        });
        // Loading will be set to false by onLoad event in FileViewer
      }
    } catch (err) {
      console.error('Error converting the pdf: ', err);
      showSnack(
        t('documentManagement.preview.creationError', 'Error creating preview'),
        'error'
      );
      setViewerLoading(false);
      setViewerOpen(false);
    }
  };

  return {
    viewerLoading,
    viewerOpen,
    viewerFile,
    setViewerLoading,
    handleCloseViewer,
    handleConvertOfficeToPdf,
  };
}
