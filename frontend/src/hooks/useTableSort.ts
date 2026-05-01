import { useState, useCallback } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  sort: string;
  dir: SortDir;
}

export function useTableSort(defaultSort?: string, defaultDir: SortDir = 'desc') {
  const [sort, setSort] = useState<string>(defaultSort || '');
  const [dir, setDir] = useState<SortDir>(defaultDir);

  const toggleSort = useCallback((field: string) => {
    if (sort === field) {
      setDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setDir('desc');
    }
  }, [sort]);

  const buildApiParams = useCallback(() => {
    if (!sort) return {};
    return { sort: dir === 'desc' ? `-${sort}` : sort };
  }, [sort, dir]);

  const resetSort = useCallback(() => {
    setSort(defaultSort || '');
    setDir(defaultDir);
  }, [defaultSort, defaultDir]);

  return { sort, dir, toggleSort, buildApiParams, resetSort, setSort, setDir };
}
