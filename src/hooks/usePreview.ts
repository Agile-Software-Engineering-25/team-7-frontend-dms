import { useState } from 'react';
import type { Item } from '@/@types/fileExplorer';

type UsePreviewProps = {
  api: any;
  items: Item[];
  showSnack: (msg: string, severity: 'success' | 'error' | 'info') => void;
};

/**
 * Custom hook for document preview and PDF conversion
 */
export function usePreview({ api, items, showSnack }: UsePreviewProps) {
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<{
    id: string;
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewerFile(null);
  };

  const handleConvertOfficeToPdf = async (docId: string) => {
    try {
      setViewerLoading(true);
      const doc = items.find((i) => i.id === docId);
      if (!doc) return;

      setViewerFile(null);
      setViewerOpen(true);
      setViewerLoading(true);

      const isOfficeDoc = /\.(docx?|pptx?)$/i.test(doc.name);

      if (!isOfficeDoc) {
        const { url, name, type } = await api.downloadDocument(docId);

        setViewerFile({ id: docId, url, name, type });
        setViewerOpen(true);
        return;
      } else {
        const converted = await api.convertOfficeToPdf(docId);
        setViewerFile({
          id: docId,
          url: converted.url,
          name: converted.name,
          type: converted.type,
        });
        setViewerLoading(false);
      }
    } catch (err) {
      console.error('Fehler bei PDF-Konvertierung:', err);
      showSnack('Fehler bei der Vorschau-Erstellung', 'error');
      setViewerLoading(false);
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
