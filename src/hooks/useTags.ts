import { useCallback, useEffect, useState } from 'react';
import type { TagEntity } from '@/@types/fileExplorer';
import useDmsApiSelector from './useDmsApiSelector';

/**
 * Hook for managing tags in the DMS
 * Provides tag CRUD operations and caching
 */
const useTags = () => {
  const api = useDmsApiSelector();
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tags
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTags = await api.getAllTags();
      setTags(fetchedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Create a new tag
  const createTag = useCallback(
    async (tagName: string) => {
      try {
        const newTag = await api.createTag(tagName);
        setTags((prev) => [...prev, newTag]);
        return newTag;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api]
  );

  // Update an existing tag
  const updateTag = useCallback(
    async (tagUuid: string, tagName: string) => {
      try {
        const updatedTag = await api.updateTag(tagUuid, tagName);
        setTags((prev) =>
          prev.map((t) => (t.uuid === tagUuid ? updatedTag : t))
        );
        return updatedTag;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api]
  );

  // Delete a tag
  const deleteTag = useCallback(
    async (tagUuid: string) => {
      try {
        await api.deleteTag(tagUuid);
        setTags((prev) => prev.filter((t) => t.uuid !== tagUuid));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api]
  );

  // Update tags on a document
  const updateDocumentTags = useCallback(
    async (documentId: string, tagUuids: string[]) => {
      try {
        await api.updateDocumentTags(documentId, tagUuids);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update document tags';
        setError(message);
        throw new Error(message);
      }
    },
    [api]
  );

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    updateDocumentTags,
  };
};

export default useTags;
