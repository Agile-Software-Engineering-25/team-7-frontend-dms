import { useState, useRef, useEffect } from 'react';
import type { Item, TagEntity } from '@/@types/fileExplorer';

/**
 * Custom hook for search functionality with tag filtering
 * @param items - The items to search through
 * @param selectedTags - Tags to filter by (optional)
 * @returns Search state and handlers
 */
export function useSearch(items: Item[], selectedTags: TagEntity[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter function that applies both text search and tag filters
  const filterItems = (query: string, tags: TagEntity[]) => {
    let filtered = items;

    // Apply tag filter
    if (tags.length > 0) {
      const tagUuids = tags.map((t) => t.uuid);
      filtered = filtered.filter((item) => {
        // Always show folders regardless of tag selection
        if (item.itemType === 'folder') return true;

        // For documents, filter by tags
        if (!item.tags || item.tags.length === 0) return false;
        // Check if item has at least one of the selected tags
        return item.tags.some((tag) => tagUuids.includes(tag.uuid));
      });
    }

    // Apply text search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
    }

    // Sort alphabetically (case-insensitive). Keep folders before files if both exist.
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    const folders = filtered.filter((i) => i.itemType === 'folder');
    const files = filtered.filter((i) => i.itemType !== 'folder');
    folders.sort((a, b) => collator.compare(a.name, b.name));
    files.sort((a, b) => collator.compare(a.name, b.name));
    return [...folders, ...files];
  };

  // Update filtered items when items, search query, or selected tags change
  useEffect(() => {
    const filtered = filterItems(searchQuery, selectedTags);
    setFilteredItems(filtered);
  }, [items, searchQuery, selectedTags]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const filtered = filterItems(value, selectedTags);
      setFilteredItems(filtered);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const filtered = filterItems('', selectedTags);
    setFilteredItems(filtered);
  };

  return {
    searchQuery,
    filteredItems,
    handleSearch,
    clearSearch,
  };
}
