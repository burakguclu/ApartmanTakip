import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for handling async operations with loading and error states
 */
export function useAsync<T>() {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFn: () => Promise<T>, successMessage?: string): Promise<T | null> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await asyncFn();
      setState({ data: result, isLoading: false, error: null });
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu';
      setState({ data: null, isLoading: false, error: message });
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Custom hook for pagination
 */
export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [pageLimit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageLimit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  const goToPage = useCallback((p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  }, [totalPages]);

  return {
    page,
    limit: pageLimit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    goToPage,
    setTotal,
    setLimit,
  };
}

/**
 * Custom hook for search with debounce
 */
export function useSearch(delay: number = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    const timer = setTimeout(() => {
      setDebouncedTerm(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedTerm('');
  }, []);

  return { searchTerm, debouncedTerm, handleSearch, clearSearch };
}

/**
 * Custom hook for modal state
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingId(null);
  }, []);

  return { isOpen, editingId, isEditing: !!editingId, openCreate, openEdit, close };
}
