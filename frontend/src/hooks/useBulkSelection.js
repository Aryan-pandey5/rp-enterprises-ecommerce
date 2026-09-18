import { useState, useMemo, useEffect, useRef } from 'react';

/**
 * Custom React hook for managing bulk selection states across tables/lists.
 * Handles Select All (current page visible items), individual row selection,
 * indeterminate checkbox state, and selection reset.
 */
export function useBulkSelection(visibleItems = [], idField = 'id') {
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);

  const visibleIds = useMemo(() => {
    return (visibleItems || []).map((item) => item[idField]);
  }, [visibleItems, idField]);

  // Check if all visible items are selected
  const isAllSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds.includes(id));
  }, [visibleIds, selectedIds]);

  // Check if some (but not all) visible items are selected
  const isSomeSelected = useMemo(() => {
    if (isAllSelected || visibleIds.length === 0) return false;
    return visibleIds.some((id) => selectedIds.includes(id));
  }, [visibleIds, selectedIds, isAllSelected]);

  // Sync indeterminate property on the Select All checkbox element
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  // Select or Deselect all visible items on current page
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  // Toggle selection for a single row ID
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds([]);
  };

  return {
    selectedIds,
    setSelectedIds,
    isAllSelected,
    isSomeSelected,
    selectAllRef,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    selectedCount: selectedIds.length
  };
}
