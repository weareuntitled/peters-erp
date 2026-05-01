import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';
import DataTable from '../../components/table/DataTable';
import apiClient from '../../api/apiClient';
import warengruppenService, { Warengruppe } from '../../api/warengruppenService';
import useTranslation from '../../hooks/useTranslation';

interface Artikel {
  id: number;
  artnr: string;
  bezeichnung: string;
  langtext: string | null;
  warengruppe_id: number | null;
  vk_preis: number;
  preis_brutto: number;
  mwst_satz: number;
  einheit: string;
  ek_preis: number;
  gewicht: number | null;
  kurztext: string | null;
  artzusatz: string | null;
  sachnr: string | null;
  aktiv: number;
}

interface PaginatedResponse {
  items: Artikel[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const ProductsPage = () => {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [warengruppeFilter, setWarengruppeFilter] = useState<number | null>(null);

  const { data: warengruppen } = useQuery<Warengruppe[]>({
    queryKey: ['warengruppen'],
    queryFn: warengruppenService.getAll,
  });

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['artikel', pagination, sorting, warengruppeFilter],
    queryFn: async () => {
      const sortParam = sorting.length
        ? `&sort=${sorting[0].id}&order=${sorting[0].desc ? 'desc' : 'asc'}`
        : '';
      const warengruppeParam = warengruppeFilter ? `&warengruppe_id=${warengruppeFilter}` : '';
      const response = await apiClient.get(
        `/artikel?skip=${pagination.pageIndex * pagination.pageSize}&limit=${pagination.pageSize}${sortParam}${warengruppeParam}`
      );
      return response.data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getWarengruppeLabel = (id: number | null) => {
    if (!id || !warengruppen) return '-';
    const wg = warengruppen.find(w => w.id === id);
    return wg?.bezeichnung || '-';
  };

  const columns: ColumnDef<Artikel>[] = [
    {
      accessorKey: 'artnr',
      header: t('products.articleNumber'),
      size: 100,
    },
    {
      accessorKey: 'bezeichnung',
      header: t('products.description'),
      size: 300,
    },
    {
      accessorKey: 'warengruppe_id',
      header: t('products.category'),
      cell: info => getWarengruppeLabel(info.getValue() as number | null),
      size: 150,
    },
    {
      accessorKey: 'kurztext',
      header: t('products.shortText'),
      size: 200,
    },
    {
      accessorKey: 'vk_preis',
      header: t('products.salesPrice'),
      cell: info => formatCurrency(info.getValue() as number),
    },
    {
      accessorKey: 'mwst_satz',
      header: t('products.taxRate'),
      cell: info => `${info.getValue()}%`,
    },
    {
      accessorKey: 'einheit',
      header: t('products.unit'),
    },
    {
      accessorKey: 'ek_preis',
      header: t('products.purchasePrice'),
      cell: info => formatCurrency(info.getValue() as number),
    },
    {
      accessorKey: 'aktiv',
      header: t('products.active'),
      cell: info => (info.getValue() as number) === 1 ? t('common.yes') : t('common.no'),
    },
  ];

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('errors.connectionError')}
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {t('errors.serverError')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('products.title')}
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('products.category')}:
        </label>
        <select
          value={warengruppeFilter || ''}
          onChange={(e) => {
            setWarengruppeFilter(e.target.value ? Number(e.target.value) : null);
            setPagination(p => ({ ...p, pageIndex: 0 }));
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="">Alle</option>
          {warengruppen?.map((wg) => (
            <option key={wg.id} value={wg.id}>
              {wg.bezeichnung}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <DataTable
          data={data?.items || []}
          columns={columns}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={data ? {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount: data.pages,
            total: data.total,
          } : undefined}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  );
};

export default ProductsPage;