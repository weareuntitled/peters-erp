import { useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  ColumnDef,
  SortingState,
  PaginationState,
  flexRender,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  pagination,
  sorting: controlledSorting,
  onSortingChange,
  onPaginationChange,
  isLoading = false,
}: DataTableProps<T>) {
  // Local state for uncontrolled sorting
  const [sorting, setSorting] = useState<SortingState>([]);

  // Handle sorting
  const handleSortingChange = (updatedSorting: SortingState) => {
    if (onSortingChange) {
      onSortingChange(updatedSorting);
    } else {
      setSorting(updatedSorting);
    }
  };

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: controlledSorting || sorting,
      ...(pagination && { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }),
    },
    manualSorting: Boolean(onSortingChange),
    manualPagination: Boolean(onPaginationChange),
    pageCount: pagination?.pageCount ?? -1,
    onSortingChange: handleSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Wird geladen...
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Keine Ergebnisse gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Zeige {pagination.pageIndex * pagination.pageSize + 1} bis{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)} von{' '}
            {pagination.total} Einträgen
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;