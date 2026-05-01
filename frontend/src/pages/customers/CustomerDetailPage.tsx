import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';
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
}

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
}

interface KundeStatistik {
  kunde_id: number;
  total_umsatz: number;
  umsatz_by_year: Record<string, number>;
  doc_counts: Record<string, number>;
  total_documents: number;
  produkte_by_warengruppe: Record<string, {
    count: number;
    menge: number;
    umsatz: number;
  }>;
  top_produkte: Array<{
    artikel_id: number;
    artnr: string;
    bezeichnung: string;
    menge: number;
    gesamtpreis: number;
  }>;
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

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const kundeId = Number(id);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: kunde, isLoading: kundeLoading } = useQuery<Kunde>({
    queryKey: ['kunde', kundeId],
    queryFn: async () => {
      const response = await apiClient.get(`/kunden/${kundeId}`);
      return response.data;
    },
  });

  const { data: statistik, isLoading: statistikLoading } = useQuery<KundeStatistik>({
    queryKey: ['kunde-statistik', kundeId],
    queryFn: async () => {
      const response = await apiClient.get(`/kunden/${kundeId}/statistik`);
      return response.data;
    },
  });

  const { data: dokumente } = useQuery<PaginatedResponse>({
    queryKey: ['kunde-dokumente', kundeId, pagination, sorting],
    queryFn: async () => {
      const sortParam = sorting.length
        ? `&sort=${sorting[0].id}&order=${sorting[0].desc ? 'desc' : 'asc'}`
        : '';
      const response = await apiClient.get(
        `/dokumente?kunde_id=${kundeId}&skip=${pagination.pageIndex * pagination.pageSize}&limit=${pagination.pageSize}${sortParam}`
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

  const documentColumns: ColumnDef<Dokument>[] = [
    {
      accessorKey: 'dokument_nr',
      header: t('invoices.documentNumber'),
      size: 150,
    },
    {
      accessorKey: 'typ',
      header: t('invoices.type'),
      cell: info => TYP_LABELS[info.getValue() as string] || info.getValue(),
    },
    {
      accessorKey: 'datum',
      header: t('invoices.date'),
      cell: info => formatDate(info.getValue() as string),
    },
    {
      accessorKey: 'status',
      header: t('invoices.status'),
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
  ];

  if (kundeLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (!kunde) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Kunde nicht gefunden</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/customers" className="text-sm text-gray-500 hover:text-gray-700">
            ← {t('customers.title')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {kunde.name} {kunde.vorname || ''}
          </h1>
          {kunde.kundnr && (
            <p className="text-sm text-gray-500">{t('customers.customerNumber')}: {kunde.kundnr}</p>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Kundendaten</h2>
        <div className="grid grid-cols-2 gap-4">
          {kunde.strasse && (
            <div>
              <p className="text-sm text-gray-500">{t('customers.street')}</p>
              <p>{kunde.strasse}</p>
              <p>{kunde.plz} {kunde.ort}</p>
            </div>
          )}
          {kunde.telefon && (
            <div>
              <p className="text-sm text-gray-500">{t('customers.phone')}</p>
              <p>{kunde.telefon}</p>
            </div>
          )}
          {kunde.mobil && (
            <div>
              <p className="text-sm text-gray-500">{t('customers.mobile')}</p>
              <p>{kunde.mobil}</p>
            </div>
          )}
          {kunde.email && (
            <div>
              <p className="text-sm text-gray-500">{t('customers.email')}</p>
              <p>{kunde.email}</p>
            </div>
          )}
          {kunde.kundengruppe && (
            <div>
              <p className="text-sm text-gray-500">{t('customers.customerGroup')}</p>
              <p>{kunde.kundengruppe}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {statistik && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Umsatz by Year */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Umsatz</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(statistik.total_umsatz)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Umsatz nach Jahr</p>
              {Object.entries(statistik.umsatz_by_year).map(([year, umsatz]) => (
                <div key={year} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{year}</span>
                  <span className="font-medium">{formatCurrency(umsatz)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document Counts */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Dokumente</h2>
            <p className="mb-4 text-2xl font-bold">{statistik.total_documents}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statistik.doc_counts).map(([typ, count]) => (
                <div key={typ} className="flex justify-between rounded bg-gray-50 px-3 py-2 dark:bg-gray-700">
                  <span className="text-sm">{TYP_LABELS[typ] || typ}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Products by Warengruppe */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Leistungen (Warengruppen)</h2>
            <div className="space-y-3">
              {Object.entries(statistik.produkte_by_warengruppe).map(([wg, data]) => (
                <div key={wg} className="border-b border-gray-200 pb-2 last:border-0 dark:border-gray-700">
                  <div className="flex justify-between font-medium">
                    <span>{wg}</span>
                    <span className="text-green-600">{formatCurrency(data.umsatz)}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {data.count} Positionen · {data.menge.toFixed(1)} Einheiten
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Top Produkte</h2>
            <div className="space-y-2">
              {statistik.top_produkte.slice(0, 10).map((produkt, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="truncate">
                    <span className="font-mono text-gray-500">{produkt.artnr}</span>
                    {' '}
                    <span className="truncate">{produkt.bezeichnung}</span>
                  </span>
                  <span className="ml-2 whitespace-nowrap font-medium">
                    {formatCurrency(produkt.gesamtpreis)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Alle Dokumente</h2>
        <DataTable
          data={dokumente?.items || []}
          columns={documentColumns}
          isLoading={!dokumente}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={dokumente ? {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount: dokumente.pages,
            total: dokumente.total,
          } : undefined}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  );
};

export default CustomerDetailPage;