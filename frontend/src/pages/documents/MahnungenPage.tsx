import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';

const statusColor = (status: string) => {
  switch (status) {
    case 'bezahlt': return 'bg-emerald-600';
    case 'überfällig': return 'bg-red-700';
    default: return 'bg-zinc-500';
  }
};

const TYP_LABELS: Record<string, string> = {
  'AN': 'Angebot',
  'RE': 'Rechnung',
  'LI': 'Lieferschein',
  'GU': 'Gutschrift',
  'MA': 'Mahnung',
  'AU': 'Auftrag',
  'ST': 'Stornierung',
};

const MahnungenPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const stored = localStorage.getItem('gswin_limit_mahnungen');
    return stored ? parseInt(stored, 10) : 10;
  });

  const { data, isLoading } = useQuery({
    queryKey: ['mahnungen', search, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { skip: (page - 1) * limit, limit, typ: 'MA' };
      if (search) params.dokument_nr = search;
      const res = await apiClient.get('/dokumente', { params });
      return res.data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1 className="font-heading text-base font-semibold text-sky-950">Mahnungen</h1>
      </div>

      {/* Search and Pagination */}
      <div className="flex items-center gap-4">
        <div className="flex-1 rounded bg-white p-4 outline outline-1 outline-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Mahnung suchen..."
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
              localStorage.setItem('gswin_limit_mahnungen', String(newLimit));
            }}
            className="rounded border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded bg-white outline outline-1 outline-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-20 px-6 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500">STATUS</th>
              <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500">MAHNUNG</th>
              <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500">KUNDE</th>
              <th className="px-6 py-3 text-left text-xs font-normal uppercase tracking-wide text-slate-500">DATUM</th>
              <th className="px-6 py-3 text-right text-xs font-normal uppercase tracking-wide text-slate-500">BETRAG</th>
              <th className="w-24 px-6 py-3 text-right text-xs font-normal uppercase tracking-wide text-slate-500">AKTIONEN</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((doc: any) => (
              <tr 
                key={doc.id} 
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => navigate(`/mahnungen/${doc.id}`)}
              >
                <td className="px-6 py-4"><span className={`inline-block h-3.5 w-3.5 rounded-full ${statusColor(doc.status)}`} /></td>
                <td className="px-6 py-4 text-xs font-medium text-slate-900">{doc.dokument_nr}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{doc.kunde_name || `Kunde #${doc.kunde_id}`}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{doc.datum || '—'}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-900">{formatCurrency(doc.betrag_brutto || 0)}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/mahnungen/${doc.id}/edit`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-sky-950"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Möchten Sie diese Mahnung wirklich löschen?')) {
                          // TODO: Implement delete
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
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Keine Mahnungen gefunden</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-xs font-semibold tracking-tight text-slate-500">
              Zeige {(data.page - 1) * data.size + 1}-{Math.min(data.page * data.size, data.total)} von {data.total} Mahnungen
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
    </div>
  );
};

export default MahnungenPage;
