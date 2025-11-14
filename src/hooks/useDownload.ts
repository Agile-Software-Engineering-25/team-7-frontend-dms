import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item, DocForZip } from '@/@types/fileExplorer';
import useDmsApiSelector from '@hooks/useDmsApiSelector';
import { collectDocsFromFolderWithPaths } from '@utils/fileHelpers';

type UseDownloadProps = {
  items: Item[];
  showSnack: (msg: string, severity: 'success' | 'error' | 'info') => void;
};

/**
 * Custom hook for download operations
 * Handles single document, folder, and multi-file downloads
 */
export function useDownload({ items, showSnack }: UseDownloadProps) {
  const api = useDmsApiSelector();
  const { t } = useTranslation();
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const handleDownload = async (docId: string) => {
    // Show feedback immediately
    showSnack(
      t('documentManagement.snack.downloadStarting', 'Preparing download...'),
      'info'
    );

    try {
      const doc = items.find((i) => i.id === docId);
      if (!doc) return;

      if (doc.itemType === 'document' || doc.itemType === 'pdf') {
        const { url, name } = await api.downloadDocument(docId);

        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

        showSnack(
          t('documentManagement.snack.downloaded', 'Download abgeschlossen'),
          'success'
        );
      } else if (doc.itemType === 'folder') {
        const docsForZip = await collectDocsFromFolderWithPaths(
          api,
          doc.id,
          doc.name
        );

        if (docsForZip.length === 0) {
          showSnack(
            t(
              'documentManagement.snack.noDocsInSelection',
              'No files to download'
            ),
            'error'
          );
          return;
        }

        await api.downloadAsZip(docsForZip, doc.name);

        showSnack(
          t('documentManagement.snack.downloaded', 'Download abgeschlossen'),
          'success'
        );
      }
    } catch {
      showSnack(
        t('documentManagement.snack.downloadFailed', 'Download fehlgeschlagen'),
        'error'
      );
    }
  };

  const handleDownloadSelected = async (selectedIds: string[]) => {
    // Show feedback immediately
    showSnack(
      t(
        'documentManagement.snack.downloadStarting',
        'Download wird vorbereitet...'
      ),
      'info'
    );

    try {
      const allDocs: DocForZip[] = [];

      for (const id of selectedIds) {
        const item = items.find((i) => i.id === id);
        if (!item) continue;

        if (item.itemType === 'document' || item.itemType === 'pdf') {
          const { url, name } = await api.downloadDocument(id);
          allDocs.push({ url, name, path: '' });
        } else if (item.itemType === 'folder') {
          const folderDocs = await collectDocsFromFolderWithPaths(
            api,
            id,
            item.name
          );
          allDocs.push(...folderDocs);
        }
      }

      if (allDocs.length === 0) {
        showSnack(
          t('documentManagement.snack.noDocsInSelection', 'Keine Dokumente'),
          'error'
        );
        return;
      }

      await api.downloadAsZip(allDocs, 'documents');
      showSnack(
        t('documentManagement.snack.downloaded', 'Download abgeschlossen'),
        'success'
      );
    } catch {
      showSnack(
        t('documentManagement.snack.downloadFailed', 'Download fehlgeschlagen'),
        'error'
      );
    }
  };

  return {
    downloadDialogOpen,
    setDownloadDialogOpen,
    handleDownload,
    handleDownloadSelected,
  };
}
