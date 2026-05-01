import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';

const ArtikelDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: artikel, isLoading } = useQuery({
    queryKey: ['artikel', id],
    queryFn: async () => {
      const res = await apiClient.get(`/artikel/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: warengruppen } = useQuery({
    queryKey: ['warengruppen'],
    queryFn: async () => {
      const res = await apiClient.get('/warengruppen');
      return res.data.items || res.data;
    },
  });

  const getWarengruppeLabel = (wgId: number | null) => {
    if (!wgId || !warengruppen) return '—';
    const wg = warengruppen.find((w: any) => w.id === wgId);
    return wg?.bezeichnung || '—';
  };

  if (isLoading) return <div className="p-6 text-slate-500">Laden...</div>;
  if (!artikel) return <div className="p-6 text-red-500">Artikel nicht gefunden</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/stammdaten/artikel" className="text-sm text-slate-500 hover:text-slate-700">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-sky-950">
            {artikel.bezeichnung}
          </h1>
          <p className="text-sm text-slate-500">{artikel.artnr}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/stammdaten/artikel/${id}/edit`}
            className="rounded px-4 py-2 text-sm font-medium text-slate-700 outline outline-1 outline-slate-200 hover:bg-slate-50"
          >
            Bearbeiten
          </Link>
          <Link
            to={`/angebote/new?artikel=${id}`}
            className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white"
          >
            Angebot erstellen
          </Link>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-2 gap-6 rounded bg-white p-6 outline outline-1 outline-slate-200">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Artikelnummer</div>
          <div className="mt-1 font-heading text-lg text-slate-900">{artikel.artnr}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Warengruppe</div>
          <div className="mt-1 text-lg text-slate-900">{getWarengruppeLabel(artikel.warengruppe_id)}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">VK-Preis</div>
          <div className="mt-1 font-heading text-lg text-slate-900">{formatCurrency(artikel.vk_preis || 0)}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">EK-Preis</div>
          <div className="mt-1 text-lg text-slate-900">{formatCurrency(artikel.ek_preis || 0)}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">MwSt-Satz</div>
          <div className="mt-1 text-lg text-slate-900">{artikel.mwst_satz}%</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Einheit</div>
          <div className="mt-1 text-lg text-slate-900">{artikel.einheit || 'Stk'}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
          <div className="mt-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${artikel.aktiv ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
            <span className="ml-2 text-lg text-slate-900">{artikel.aktiv ? 'Aktiv' : 'Inaktiv'}</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Gewicht</div>
          <div className="mt-1 text-lg text-slate-900">{artikel.gewicht ? `${artikel.gewicht} kg` : '—'}</div>
        </div>
      </div>

      {/* Text Info */}
      {(artikel.kurztext || artikel.langtext) && (
        <div className="rounded bg-white p-6 outline outline-1 outline-slate-200">
          <h2 className="mb-4 font-heading text-base font-semibold text-sky-950">Beschreibung</h2>
          {artikel.kurztext && <p className="text-sm text-slate-700">{artikel.kurztext}</p>}
          {artikel.langtext && <p className="mt-2 text-sm text-slate-700">{artikel.langtext}</p>}
        </div>
      )}
    </div>
  );
};

export default ArtikelDetailPage;
