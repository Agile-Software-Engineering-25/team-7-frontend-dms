import useAxiosInstance from '@hooks/useAxiosInstance';
import { BACKEND_BASE_URL } from '@/config';
import { useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { TagEntity } from '@/@types/fileExplorer';

type FolderResponse = {
  folders: {
    id: string;
    name: string;
    parentId?: string;
    studyGroupIds?: string;
    createdDate?: string;
  };
  subfolders: Array<{
    id: string;
    name: string;
    parentId?: string;
    studyGroupIds?: string;
    createdDate?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    ownerId?: string;
    createdDate?: string;
    downloadUrl?: string;
  }>;
};

type StudyGroupsResponse = {
  group_count: number;
  groups: Array<{
    name: string;
    students_count: number;
    students: null;
  }>;
};

const useDmsApi = () => {
  const axiosInstance = useAxiosInstance(BACKEND_BASE_URL);

  const getFolder = useCallback(
    // GET folders
    async (id: string) => {
      const response = await axiosInstance.get<FolderResponse>(
        `/dms/v1/folders/${id}`
      );
      return response.data;
    },
    [axiosInstance]
  );

  const getStudyGroups = useCallback(
    // GET study groups (cohorts)
    async () => {
      const response = await axiosInstance.get<StudyGroupsResponse>(
        `/team-11-api/api/v1/group`,
        {
          params: {
            show_members: false,
            withDetails: false,
          },
        }
      );
      return response.data;
    },
    [axiosInstance]
  );

  const renameDocument = useCallback(
    // PATCH document to rename a document
    async (id: string, name: string) => {
      const response = await axiosInstance.patch(`/dms/v1/documents/${id}`, {
        name,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const renameFolder = useCallback(
    // PATCH folder to rename a folder
    async (id: string, name: string) => {
      const response = await axiosInstance.patch(`/dms/v1/folders/${id}`, {
        name,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const deleteDocument = useCallback(
    // DELETE document
    async (id: string) => {
      await axiosInstance.delete(`/dms/v1/documents/${id}`);
    },
    [axiosInstance]
  );

  const deleteFolder = useCallback(
    // DELETE folder
    async (id: string) => {
      await axiosInstance.delete(`/dms/v1/folders/${id}`);
    },
    [axiosInstance]
  );

  const uploadDocument = useCallback(
    // POST document to upload a document
    async (file: File, folderId: string) => {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('folderId', folderId);
      const response = await axiosInstance.post('/dms/v1/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    [axiosInstance]
  );

  const downloadDocument = useCallback(
    // GET document/download to download a document
    async (id: string) => {
      const response = await axiosInstance.get(
        `/dms/v1/documents/${id}/download`,
        {
          responseType: 'blob',
        }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = `document-${id}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      let mimeType =
        response.headers['Content-type'] ?? 'application/octet-stream';
      // Fallback if backend delivers generic
      if (mimeType === 'application/octet-stream' && filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'svg':
            mimeType = 'image/svg+xml';
            break;
          case 'txt':
            mimeType = 'text/plain';
            break;
          case 'html':
          case 'htm':
            mimeType = 'text/html';
            break;
          case 'csv':
            mimeType = 'text/csv';
            break;
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: mimeType })
      );
      return { url, name: filename, type: mimeType };
    },
    [axiosInstance]
  );

  const downloadAsZip = useCallback(
    // Download folders as ZIP
    async (
      docs: { url: string; name: string; path: string }[],
      folderName?: string
    ) => {
      if (!docs || docs.length === 0) {
        throw new Error('No documents to zip');
      }
      const zip = new JSZip();

      for (const doc of docs) {
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const fullPath = doc.path ? `${doc.path}/${doc.name}` : doc.name;
        zip.file(fullPath, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const folder = folderName || 'documents';
      saveAs(content, `${folder}.zip`);
    },
    []
  );

  const createFolder = useCallback(
    async (name: string, parentId?: string, studyGroupIds?: string[]) => {
      const response = await axiosInstance.post('/dms/v1/folders', {
        name,
        parentId,
        studyGroupIds,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const updateFolderStudyGroups = useCallback(
    async (id: string, studyGroupIds: string[]) => {
      const response = await axiosInstance.patch(`/dms/v1/folders/${id}`, {
        studyGroupIds,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const moveDocument = useCallback(
    async (id: string, folderId?: string) => {
      // PATCH document to update its parent folder. Backend may support other move semantics.
      const response = await axiosInstance.patch(`/dms/v1/documents/${id}`, {
        folderId,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const moveFolder = useCallback(
    async (id: string, parentId?: string) => {
      // PATCH folder to update its parent folder.
      const response = await axiosInstance.patch(`/dms/v1/folders/${id}`, {
        parentId,
      });
      return response.data;
    },
    [axiosInstance]
  );

  const convertOfficeToPdf = useCallback(
    async (
      id: string
    ): Promise<{ url: string; name: string; type: string }> => {
      const response = await axiosInstance.get(
        `/dms/v1/documents/${id}/pdfconverter`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      return { url, name: `converted-${id}.pdf`, type: 'application/pdf' };
    },
    [axiosInstance]
  );

  const getAllTags = useCallback(
    // GET all tags
    async () => {
      const response = await axiosInstance.get<TagEntity[]>(`/v1/tags`);
      return response.data;
    },
    [axiosInstance]
  );

  const createTag = useCallback(
    // POST create a new tag
    async (tagName: string) => {
      const response = await axiosInstance.post<TagEntity>(
        `/v1/tags/${tagName}`
      );
      return response.data;
    },
    [axiosInstance]
  );

  const updateTag = useCallback(
    // PUT update a tag
    async (tagUuid: string, tagName: string) => {
      const response = await axiosInstance.put<TagEntity>(
        `/v1/tags/${tagUuid}`,
        tagName,
        {
          headers: { 'Content-Type': 'text/plain' },
        }
      );
      return response.data;
    },
    [axiosInstance]
  );

  const deleteTag = useCallback(
    // DELETE a tag
    async (tagUuid: string) => {
      await axiosInstance.delete(`/v1/tags/${tagUuid}`);
    },
    [axiosInstance]
  );

  const updateDocumentTags = useCallback(
    // PUT document tags
    async (id: string, tags: string[]) => {
      const response = await axiosInstance.put(
        `/dms/v1/documents/${id}/tags`,
        tags
      );
      return response.data;
    },
    [axiosInstance]
  );

  const api = useMemo(
    () => ({
      getFolder,
      getStudyGroups,
      renameDocument,
      renameFolder,
      deleteDocument,
      deleteFolder,
      uploadDocument,
      downloadDocument,
      downloadAsZip,
      createFolder,
      updateFolderStudyGroups,
      moveDocument,
      moveFolder,
      convertOfficeToPdf,
      getAllTags,
      createTag,
      updateTag,
      deleteTag,
      updateDocumentTags,
    }),
    [
      getFolder,
      getStudyGroups,
      renameDocument,
      renameFolder,
      deleteDocument,
      deleteFolder,
      uploadDocument,
      downloadDocument,
      downloadAsZip,
      createFolder,
      updateFolderStudyGroups,
      moveDocument,
      moveFolder,
      convertOfficeToPdf,
      getAllTags,
      createTag,
      updateTag,
      deleteTag,
      updateDocumentTags,
    ]
  );

  return api;
};

export default useDmsApi;
