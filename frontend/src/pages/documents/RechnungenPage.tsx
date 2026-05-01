import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';
import { useTableSort } from '../../hooks/useTableSort';
import SortableHeader from '../../components/ui/SortableHeader';
import DeleteModal from '../../components/ui/DeleteModal';

import { statusColor } from '../../utils/statusColors';

const RechnungenPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const stored = localStorage.getItem('gswin_limit_rechnungen');
    return stored ? parseInt(stored, 10) : 10;
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [paidId, setPaidId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: number } | null>(null);

  const { sort, dir, toggleSort, buildApiParams } = useTableSort('datum', 'desc');

  const { data, isLoading } = useQuery({
    queryKey: ['rechnungen', search, page, limit, sort, dir],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * limit,
        limit,
        ...buildApiParams(),
      };
      if (search) params.dokument_nr = search;
      params.typ = 'RE';
      const res = await apiClient.get('/dokumente', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/dokumente/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rechnungen'] });
      setDeleteId(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.put(`/dokumente/${id}/status`, null, { params: { status: 'bezahlt' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rechnungen'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-aggregate'] });
      setPaidId(null);
    },
  });

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem('gswin_limit_rechnungen', String(newLimit));
  };

  const handleContextMenu = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.y, id });
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="flex flex-col gap-6" onClick={closeContextMenu}>
      <div className="flex items-end justify-between">
        <h1 className="font-heading text-base font-semibold text-sky-950">Rechnungen</h1>
        <Link to="/rechnungen/new" className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
          Neue Rechnung
        </Link>
      </div>

      {/* Search and Pagination Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1 rounded bg-white p-4 outline outline-1 outline-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechnung suchen..."
            className="w-full rounded border border-slate-200 px-3 py-2 text-xs outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex items-center gap-3">
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

      <div className="overflow-hidden rounded bg-white outline outline-1 outline-slate-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-20 px-6 py-3 text-left">
                <SortableHeader label="STATUS" field="status" currentSort={sort} currentDir={dir} onSort={toggleSort} />
              </th>
              <th className="px-6 py-3 text-left">
                <SortableHeader label="RECHNUNG" field="dokument_nr" currentSort={sort} currentDir={dir} onSort={toggleSort} />
              </th>
              <th className="px-6 py-3 text-left">KUNDE</th>
              <th className="px-6 py-3 text-left">
                <SortableHeader label="DATUM" field="datum" currentSort={sort} currentDir={dir} onSort={toggleSort} />
              </th>
              <th className="px-6 py-3 text-right">
                <SortableHeader label="BETRAG" field="betrag_brutto" currentSort={sort} currentDir={dir} onSort={toggleSort} className="justify-end" />
              </th>
              <th className="w-32 px-6 py-3 text-right">AKTIONEN</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((doc: any) => (
              <tr
                key={doc.id}
                className="border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => navigate(`/rechnungen/${doc.id}`)}
                onContextMenu={(e) => handleContextMenu(e, doc.id)}
              >
                <td className="px-6 py-4"><span className={`inline-block h-3.5 w-3.5 rounded-full ${statusColor(doc.status)}`} /></td>
                <td className="px-6 py-4 text-xs font-medium text-slate-900">{doc.dokument_nr}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{doc.kunde_name || `Kunde #${doc.kunde_id}`}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{doc.datum || '—'}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-900">{formatCurrency(doc.betrag_brutto || 0)}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setPaidId(doc.id)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-emerald-600"
                      title="Als bezahlt markieren"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/rechnungen/${doc.id}/edit`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-sky-950"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/rechnungen/${doc.id}/duplicate`)}
                      className="rounded-sm p-1.5 text-slate-400 hover:text-blue-600"
                      title="Duplizieren"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(doc.id)}
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
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Keine Rechnungen gefunden</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-xs font-semibold tracking-tight text-slate-500">
              Zeige {(data.page - 1) * data.size + 1}-{Math.min(data.page * data.size, data.total)} von {data.total} Rechnungen
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

      {contextMenu && (
        <div 
          className="fixed z-50 w-48 rounded bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { setPaidId(contextMenu.id); setContextMenu(null); }}
            className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <CheckCircleIcon className="mr-3 h-4 w-4 text-emerald-600" />
            Als bezahlt markieren
          </button>
          <button 
            onClick={() => { navigate(`/rechnungen/${contextMenu.id}/edit`); setContextMenu(null); }}
            className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <PencilSquareIcon className="mr-3 h-4 w-4 text-slate-400" />
            Bearbeiten
          </button>
          <button 
            onClick={() => { setDeleteId(contextMenu.id); setContextMenu(null); }}
            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="mr-3 h-4 w-4 text-red-600" />
            Löschen
          </button>
        </div>
      )}

      {deleteId !== null && (
        <DeleteModal
          isOpen={true}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          title="Rechnung löschen"
          message="Möchten Sie diese Rechnung wirklich löschen?"
        />
      )}

      {paidId !== null && (
        <DeleteModal
          isOpen={true}
          onClose={() => setPaidId(null)}
          onConfirm={() => markPaidMutation.mutate(paidId)}
          title="Als bezahlt markieren"
          message="Soll diese Rechnung als bezahlt markiert werden?"
          confirmText="Ja, bezahlt"
          confirmColor="bg-emerald-600 hover:bg-emerald-700"
        />
      )}
    </div>
  );
};

export default RechnungenPage;
