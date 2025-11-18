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

  // Module-level cache and in-flight promise for de-duplication across hook instances
  // Note: These live across component instances during the app lifetime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;
  if (!globalAny.__DMS_TAGS_CACHE__) {
    globalAny.__DMS_TAGS_CACHE__ = {
      data: null as TagEntity[] | null,
      inFlight: null as Promise<TagEntity[]> | null,
    };
  }
  const tagsCache: {
    data: TagEntity[] | null;
    inFlight: Promise<TagEntity[]> | null;
  } = globalAny.__DMS_TAGS_CACHE__;

  // Fetch all tags
  const fetchTags = useCallback(
    async (force = false): Promise<TagEntity[]> => {
      setError(null);

      // Serve from cache if available and not forced
      if (!force && tagsCache.data) {
        setTags(tagsCache.data);
        return tagsCache.data;
      }

      // Join in-flight request if exists
      if (tagsCache.inFlight) {
        setLoading(true);
        try {
          const res = await tagsCache.inFlight;
          setTags(res);
          return res;
        } finally {
          setLoading(false);
        }
      }

      // Start new fetch
      setLoading(true);
      const p = api
        .getAllTags()
        .then((fetched) => {
          tagsCache.data = fetched;
          setTags(fetched);
          return fetched;
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch tags');
          console.error('Error fetching tags:', err);
          throw err;
        })
        .finally(() => {
          tagsCache.inFlight = null;
          setLoading(false);
        });
      tagsCache.inFlight = p;
      return p;
    },
    [api, tagsCache]
  );

  // Load tags on mount
  useEffect(() => {
    // If we already have a cache, hydrate local state only, avoid extra fetch
    if (tagsCache.data) {
      setTags(tagsCache.data);
      return;
    }
    void fetchTags();
  }, [fetchTags, tagsCache.data]);

  // Create a new tag
  const createTag = useCallback(
    async (tagName: string) => {
      try {
        const newTag = await api.createTag(tagName);
        // Update local state and cache
        setTags((prev) => {
          const next = [...prev, newTag];
          tagsCache.data = next;
          return next;
        });
        return newTag;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api, tagsCache]
  );

  // Update an existing tag
  const updateTag = useCallback(
    async (tagUuid: string, tagName: string) => {
      try {
        const updatedTag = await api.updateTag(tagUuid, tagName);
        setTags((prev) => {
          const next = prev.map((t) => (t.uuid === tagUuid ? updatedTag : t));
          tagsCache.data = next;
          return next;
        });
        return updatedTag;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api, tagsCache]
  );

  // Delete a tag
  const deleteTag = useCallback(
    async (tagUuid: string) => {
      try {
        await api.deleteTag(tagUuid);
        setTags((prev) => {
          const next = prev.filter((t) => t.uuid !== tagUuid);
          tagsCache.data = next;
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete tag';
        setError(message);
        throw new Error(message);
      }
    },
    [api, tagsCache]
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
