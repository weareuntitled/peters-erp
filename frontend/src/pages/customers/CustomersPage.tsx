import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import DataTable from '../../components/table/DataTable';
import apiClient from '../../api/apiClient';
import useTranslation from '../../hooks/useTranslation';

interface Kunde {
  id: number;
  kundnr: string | null;
  anrede: string | null;
  name: string;
  vorname: string | null;
  zusatz: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  telefon: string | null;
  mobil: string | null;
  email: string | null;
  homepage: string | null;
  iban: string | null;
  bic: string | null;
  bank: string | null;
  kundengruppe: string | null;
  kennung1: string | null;
  kennung2: string | null;
  notiz: string | null;
}

interface PaginatedResponse {
  items: Kunde[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const CustomersPage = () => {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['kunden', pagination, sorting],
    queryFn: async () => {
      const sortParam = sorting.length
        ? `&sort=${sorting[0].id}&order=${sorting[0].desc ? 'desc' : 'asc'}`
        : '';
      const response = await apiClient.get(
        `/kunden?skip=${pagination.pageIndex * pagination.pageSize}&limit=${pagination.pageSize}${sortParam}`
      );
      return response.data;
    },
  });

  const columns: ColumnDef<Kunde>[] = [
    {
      accessorKey: 'kundnr',
      header: t('customers.customerNumber'),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: t('customers.name'),
      cell: info => (
        <Link to={`/customers/${info.row.original.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
          {info.getValue() as string}
        </Link>
      ),
    },
    {
      accessorKey: 'vorname',
      header: t('customers.firstName'),
    },
    {
      accessorKey: 'strasse',
      header: t('customers.street'),
      cell: info => {
        const row = info.row.original;
        return row.strasse ? `${row.strasse}, ${row.plz} ${row.ort}` : null;
      },
    },
    {
      accessorKey: 'telefon',
      header: t('customers.phone'),
    },
    {
      accessorKey: 'email',
      header: t('customers.email'),
    },
    {
      accessorKey: 'kundengruppe',
      header: t('customers.customerGroup'),
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
          {t('customers.title')}
        </h1>
        <Link
          to="/customers/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {t('customers.newCustomer')}
        </Link>
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

export default CustomersPage;