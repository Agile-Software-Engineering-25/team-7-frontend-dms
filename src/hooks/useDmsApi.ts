import useAxiosInstance from '@hooks/useAxiosInstance';
import { BACKEND_BASE_URL } from '@/config';
import { useCallback } from 'react';

type FolderResponse = {
  folders: { id: string; name: string; parentId?: string; createdDate?: string };
  subfolders: Array<{ id: string; name: string; parentId?: string; createdDate?: string }>;
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

const useDmsApi = () => {
  const axiosInstance = useAxiosInstance(BACKEND_BASE_URL);

  const getFolder = useCallback(
    async (id: string) => {
      const response = await axiosInstance.get<FolderResponse>(`/dms/v1/folders/${id}`);
      return response.data;
    },
    [axiosInstance]
  );

  const renameDocument = useCallback(
    async (id: string, name: string) => {
      const response = await axiosInstance.patch(`/dms/v1/documents/${id}`, { name });
      return response.data;
    },
    [axiosInstance]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      await axiosInstance.delete(`/dms/v1/documents/${id}`);
    },
    [axiosInstance]
  );

  const uploadDocument = useCallback(
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

  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      const response = await axiosInstance.post('/dms/v1/folders', { name, parentId });
      return response.data;
    },
    [axiosInstance]
  );

  return { getFolder, renameDocument, deleteDocument, uploadDocument, createFolder };
};

export default useDmsApi;
