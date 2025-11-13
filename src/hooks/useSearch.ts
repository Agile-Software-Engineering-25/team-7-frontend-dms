import { useState, useRef, useEffect } from 'react';
import type { Item } from '@/@types/fileExplorer';

/**
 * Custom hook for search functionality
 * @param items - The items to search through
 * @returns Search state and handlers
 */
export function useSearch(items: Item[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update filtered items when items change and no search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = items.filter((i) => i.name.toLowerCase().includes(q));
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!value.trim()) {
        setFilteredItems(items);
        return;
      }

      const q = value.toLowerCase();
      const filtered = items.filter((i) => i.name.toLowerCase().includes(q));
      setFilteredItems(filtered);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredItems(items);
  };

  return {
    searchQuery,
    filteredItems,
    handleSearch,
    clearSearch,
  };
}
