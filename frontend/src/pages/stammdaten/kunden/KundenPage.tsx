import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';
import { useTableSort } from '../../../hooks/useTableSort';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/ui/DeleteModal';

interface Kunde {
  id: number;
  kundnr: string;
  name: string;
  vorname: string;
  ort: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const KundenPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const stored = localStorage.getItem('gswin_limit_kunden');
    return stored ? parseInt(stored, 10) : 10;
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { sort, dir, toggleSort, buildApiParams } = useTableSort('name', 'asc');

  const { data, isLoading } = useQuery<PaginatedResponse<Kunde>>({
    queryKey: ['kunden', search, page, limit, sort, dir],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * limit,
        limit,
        ...buildApiParams(),
      };
      if (search) params.name = search;
      const res = await apiClient.get('/kunden', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/kunden/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      setDeleteId(null);
    },
  });

  const getInitials = (kunde: Kunde) => {
    const name = kunde.name || kunde.vorname || '?';
    return name.substring(0, 2).toUpperCase();
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem('gswin_limit_kunden', String(newLimit));
  };

  return (
    <div className="flex flex-col gap-6">
      {isLoading && <TableSkeleton />}
      {!isLoading && (
        <>
          {/* Breadcrumb + Title */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-tight text-slate-400">Stammdaten</span>
                <span className="text-xs text-slate-400">›</span>
                <span className="text-xs font-semibold tracking-tight text-sky-950">Kunden</span>
              </div>
              <h1 className="font-heading text-base font-normal leading-6 text-sky-950">
                Kundenstammdaten
              </h1>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline outline-1 outline-slate-200">
                Export
              </button>
              <Link
                to="/stammdaten/kunden/new"
                className="flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Neuer Kunde
              </Link>
            </div>
          </div>

          {/* Filters + Stats */}
          <div className="flex gap-4">
            <div className="flex flex-1 gap-4 rounded bg-white p-5 outline outline-1 outline-slate-200">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-500">Kunde suchen</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Name, Kundennummer oder Ort..."
                  className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="text-xs text-slate-500">Zeige:</label>
                {[10, 20, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleLimitChange(n)}
                    className={`text-xs font-medium ${limit === n ? 'text-sky-600 underline' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {n}
                  </button>
                ))}
                <span className="text-xs text-slate-400">pro Seite</span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="flex h-28 w-60 flex-col justify-between rounded bg-sky-900 p-5 text-white">
              <div className="text-xs leading-6">Gesamtanzahl Kunden</div>
              <div className="font-heading text-3xl leading-9">
                {data?.total || 0}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded bg-white outline outline-1 outline-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-24 px-4 py-3 text-left">
                    <SortableHeader label="KUNDENNR." field="kundnr" currentSort={sort} currentDir={dir} onSort={toggleSort} />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <SortableHeader label="NAME" field="name" currentSort={sort} currentDir={dir} onSort={toggleSort} />
                  </th>
                  <th className="w-32 px-4 py-3 text-left">
                    <SortableHeader label="ORT" field="ort" currentSort={sort} currentDir={dir} onSort={toggleSort} />
                  </th>
                  <th className="w-28 px-4 py-3 text-right">AKTIONEN</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((kunde) => (
                  <tr
                    key={kunde.id}
                    className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/stammdaten/kunden/${kunde.id}`)}
                  >
                    <td className="px-4 py-4 text-xs font-mono font-semibold text-slate-700">{kunde.kundnr}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-2">
                          <span className="text-xs font-semibold text-sky-950">{getInitials(kunde)}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-900">{kunde.vorname} {kunde.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {kunde.ort || '—'}
                    </td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/stammdaten/kunden/${kunde.id}/edit`)}
                          className="rounded-sm p-1.5 text-slate-400 hover:text-sky-950"
                          title="Bearbeiten"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(kunde.id)}
                          className="rounded-sm p-1.5 text-slate-400 hover:text-red-600"
                          title="Löschen"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                      Keine Kunden gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-xs font-semibold tracking-tight text-slate-500">
                  Zeige {(data.page - 1) * data.size + 1}-{Math.min(data.page * data.size, data.total)} von {data.total} Kunden
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-sm px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-30"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-sm px-3 py-1 text-xs font-medium ${
                        p === page
                          ? 'bg-sky-950 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="rounded-sm px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {deleteId !== null && (
        <DeleteModal
          isOpen={true}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          title="Kunde löschen"
          message="Möchten Sie diesen Kunden wirklich löschen?"
        />
      )}
    </div>
  );
};

export default KundenPage;
