import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon, PencilSquareIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';

const WarengruppeArtikelPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const stored = localStorage.getItem('gswin_limit_artikel');
    return stored ? parseInt(stored, 10) : 10;
  });

  const { data: warengruppe } = useQuery({
    queryKey: ['warengruppe', id],
    queryFn: async () => {
      const res = await apiClient.get(`/warengruppen/${id}`);
      return res.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['artikel-by-warengruppe', id, search, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { skip: (page - 1) * limit, limit, warengruppe_id: id };
      if (search) params.bezeichnung = search;
      const res = await apiClient.get('/artikel', { params });
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/stammdaten/warengruppen')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zurück
        </button>
      </div>

      {/* Title + Actions */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-slate-400">Stammdaten</span>
            <span className="text-xs text-slate-400">›</span>
            <button
              onClick={() => navigate('/stammdaten/warengruppen')}
              className="text-xs font-semibold tracking-tight text-slate-400 hover:text-sky-950"
            >
              Warengruppen
            </button>
            <span className="text-xs text-slate-400">›</span>
            <span className="text-xs font-semibold tracking-tight text-sky-950">Artikel</span>
          </div>
          <h1 className="font-heading text-base font-normal leading-6 text-sky-950">
            {warengruppe?.bezeichnung || 'Warengruppe'} — Artikel
          </h1>
        </div>
        <button className="flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline outline-1 outline-slate-200">
          Export
        </button>
      </div>

      {/* Search + Pagination */}
      <div className="flex items-center gap-4">
        <div className="flex-1 rounded bg-white p-4 outline outline-1 outline-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Artikel suchen..."
            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Zeige:</label>
          <select
            value={limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setLimit(newLimit);
              setPage(1);
              localStorage.setItem('gswin_limit_artikel', String(newLimit));
            }}
            className="rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded bg-white outline outline-1 outline-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">ARTIKELNUMMER</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">BEZEICHNUNG</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">VK-PREIS</th>
              <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">STATUS</th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">AKTIONEN</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((artikel: any) => (
              <tr
                key={artikel.id}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => navigate(`/stammdaten/artikel/${artikel.id}`)}
              >
                <td className="px-6 py-4 text-xs font-semibold text-slate-900">{artikel.artnr}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-900">{artikel.bezeichnung}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-900">{formatCurrency(artikel.vk_preis || 0)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${artikel.aktiv ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/stammdaten/artikel/${artikel.id}/edit`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-sky-950"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Duplicate */}}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-blue-600"
                      title="Duplizieren"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
                          // TODO: Delete
                        }
                      }}
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
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  Keine Artikel in dieser Warengruppe gefunden
                </td>
              </tr>
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
                    p === page ? 'bg-sky-950 text-white' : 'text-slate-600 hover:bg-slate-100'
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
    </div>
  );
};

export default WarengruppeArtikelPage;