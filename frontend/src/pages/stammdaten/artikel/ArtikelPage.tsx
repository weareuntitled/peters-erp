import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilSquareIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useTableSort } from '../../../hooks/useTableSort';
import SortableHeader from '../../../components/ui/SortableHeader';
import DeleteModal from '../../../components/ui/DeleteModal';

const ArtikelPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [warengruppe, setWarengruppeState] = useState(searchParams.get('warengruppe_id') || '');

  const setWarengruppe = (val: string) => {
    setWarengruppeState(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('warengruppe_id', val);
    else newParams.delete('warengruppe_id');
    setSearchParams(newParams);
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const stored = localStorage.getItem('gswin_limit_artikel');
    return stored ? parseInt(stored, 10) : 10;
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { sort, dir, toggleSort, buildApiParams } = useTableSort('artnr', 'asc');

  const { data, isLoading } = useQuery({
    queryKey: ['artikel', search, warengruppe, page, limit, sort, dir],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * limit,
        limit,
        ...buildApiParams(),
      };
      if (search) params.bezeichnung = search;
      if (warengruppe) params.warengruppe_id = warengruppe;
      const res = await apiClient.get('/artikel', { params });
      return res.data;
    },
  });

  const { data: warengruppen } = useQuery({
    queryKey: ['warengruppen'],
    queryFn: async () => {
      const res = await apiClient.get('/warengruppen');
      return res.data.items || res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/artikel/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artikel'] });
      setDeleteId(null);
    },
  });

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem('gswin_limit_artikel', String(newLimit));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + Title */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-slate-400">Stammdaten</span>
            <span className="text-xs text-slate-400">›</span>
            <span className="text-xs font-semibold tracking-tight text-sky-950">Artikel</span>
          </div>
          <h1 className="font-heading text-base font-normal leading-6 text-sky-950">
            Artikelstammdaten
          </h1>
        </div>
        <Link to="/stammdaten/artikel/new" className="flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
          <PlusIcon className="h-4 w-4" />
          Neuer Artikel
        </Link>
      </div>

      {/* Filters + Pagination */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 gap-4 rounded bg-white p-5 outline outline-1 outline-slate-200">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-500">Artikel suchen</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Bezeichnung oder Artnr..."
              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
            />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs text-slate-500">Warengruppe</label>
            <select
              value={warengruppe}
              onChange={(e) => setWarengruppe(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
            >
              <option value="">Alle Warengruppen</option>
              {warengruppen?.map((wg: any) => (
                <option key={wg.id} value={wg.id}>{wg.bezeichnung}</option>
              ))}
            </select>
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded bg-white outline outline-1 outline-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-24 px-4 py-3 text-left">
                <SortableHeader label="ARTNR." field="artnr" currentSort={sort} currentDir={dir} onSort={toggleSort} />
              </th>
              <th className="px-6 py-3 text-left">
                <SortableHeader label="BEZEICHNUNG" field="bezeichnung" currentSort={sort} currentDir={dir} onSort={toggleSort} />
              </th>
              <th className="w-40 px-4 py-3 text-left">WARENGRUPPE</th>
              <th className="w-28 px-4 py-3 text-right">
                <SortableHeader label="VK-PREIS" field="vk_preis" currentSort={sort} currentDir={dir} onSort={toggleSort} className="justify-end" />
              </th>
              <th className="w-20 px-4 py-3 text-center">STATUS</th>
              <th className="w-32 px-4 py-3 text-right">AKTIONEN</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((artikel: any) => (
              <tr
                key={artikel.id}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => navigate(`/stammdaten/artikel/${artikel.id}`)}
              >
                <td className="px-4 py-4 text-xs font-mono font-semibold text-slate-700">{artikel.artnr}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-900">{artikel.bezeichnung}</td>
                <td className="px-4 py-4 text-xs text-slate-600">{artikel.warengruppe_bezeichnung || '—'}</td>
                <td className="px-4 py-4 text-right text-xs tabular-nums text-slate-900">{formatCurrency(artikel.vk_preis || 0)}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${artikel.aktiv ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
                </td>
                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/stammdaten/artikel/${artikel.id}/edit`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-sky-950"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/stammdaten/artikel/${artikel.id}/duplicate`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-blue-600"
                      title="Duplizieren"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(artikel.id)}
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
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Keine Artikel gefunden</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-xs font-semibold tracking-tight text-slate-500">
              Zeige {(data.page - 1) * data.size + 1}-{Math.min(data.page * data.size, data.total)} von {data.total} Artikel
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-30">←</button>
              {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`rounded-sm px-3 py-1 text-xs font-medium ${p === page ? 'bg-sky-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="rounded-sm px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-30">→</button>
            </div>
          </div>
        )}
      </div>

      {deleteId !== null && (
        <DeleteModal
          isOpen={true}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          title="Artikel löschen"
          message="Möchten Sie diesen Artikel wirklich löschen?"
        />
      )}
    </div>
  );
};

export default ArtikelPage;
