import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import DataTable from '../../components/table/DataTable';
import apiClient from '../../api/apiClient';
import useTranslation from '../../hooks/useTranslation';

interface Dokument {
  id: number;
  dokument_nr: string;
  typ: string;
  status: string;
  kunde_id: number | null;
  betrag_netto: number;
  betrag_brutto: number;
  bezahlt_summe: number;
  datum: string | null;
  liefertermin: string | null;
  kopftext: string | null;
  fusstext: string | null;
  bemerkung: string | null;
  auftragsbezeichnung: string | null;
  gedruckt: number;
  gemailt: number;
  storniert: number;
}

interface PaginatedResponse {
  items: Dokument[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const TYP_LABELS: Record<string, string> = {
  'AN': 'Angebot',
  'AU': 'Auftrag',
  'LI': 'Lieferschein',
  'RE': 'Rechnung',
  'GU': 'Gutschrift',
  'ST': 'Stornierung',
  'MA': 'Mahnung',
};

const STATUS_LABELS: Record<string, string> = {
  'offen': 'Offen',
  'gedruckt': 'Gedruckt',
  'gebucht': 'Gebucht',
  'bezahlt': 'Bezahlt',
  'storniert': 'Storniert',
  'archiviert': 'Archiviert',
};

const InvoicesPage = () => {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [typFilter, setTypFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['dokumente', pagination, sorting, typFilter],
    queryFn: async () => {
      const sortParam = sorting.length
        ? `&sort=${sorting[0].id}&order=${sorting[0].desc ? 'desc' : 'asc'}`
        : '';
      const typParam = typFilter ? `&typ=${typFilter}` : '';
      const response = await apiClient.get(
        `/dokumente?skip=${pagination.pageIndex * pagination.pageSize}&limit=${pagination.pageSize}${sortParam}${typParam}`
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('de-DE');
    } catch {
      return dateStr;
    }
  };

  const columns: ColumnDef<Dokument>[] = [
    {
      accessorKey: 'dokument_nr',
      header: t('invoices.documentNumber'),
      size: 150,
    },
    {
      accessorKey: 'typ',
      header: t('invoices.type'),
      cell: info => {
        const typ = info.getValue() as string;
        return TYP_LABELS[typ] || typ;
      },
    },
    {
      accessorKey: 'datum',
      header: t('invoices.date'),
      cell: info => formatDate(info.getValue() as string),
    },
    {
      accessorKey: 'status',
      header: t('invoices.status'),
      cell: info => {
        const status = info.getValue() as string;
        return STATUS_LABELS[status] || status;
      },
    },
    {
      accessorKey: 'betrag_brutto',
      header: t('invoices.amount'),
      cell: info => formatCurrency(info.getValue() as number),
    },
    {
      accessorKey: 'bezahlt_summe',
      header: t('invoices.paid'),
      cell: info => formatCurrency(info.getValue() as number),
    },
    {
      accessorKey: 'betrag_brutto',
      header: t('invoices.open'),
      cell: info => {
        const row = info.row.original;
        const open = (row.betrag_brutto || 0) - (row.bezahlt_summe || 0);
        return formatCurrency(open);
      },
    },
    {
      accessorKey: 'liefertermin',
      header: t('invoices.deliveryDate'),
      cell: info => formatDate(info.getValue() as string),
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
          {t('invoices.title')}
        </h1>
        <div className="flex gap-2">
          {Object.entries(TYP_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypFilter(typFilter === key ? '' : key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typFilter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

export default InvoicesPage;