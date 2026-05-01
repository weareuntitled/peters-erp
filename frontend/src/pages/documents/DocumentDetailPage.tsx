import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import apiClient, { API_BASE_URL } from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';

interface DocumentDetailPageProps {
  type?: 'RE' | 'AN' | 'LI' | 'MA' | 'ST' | 'AU' | 'GU';
}

const typeLabels = {
  RE: 'Rechnung',
  AN: 'Angebot',
  LI: 'Lieferschein',
  MA: 'Mahnung',
  ST: 'Stornierung',
  AU: 'Auftrag',
  GU: 'Gutschrift',
};

const DocumentDetailPage = ({ type }: DocumentDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const basePath = type === 'AN' ? '/angebote' : '/rechnungen';

  const { data: dokument, isLoading } = useQuery({
    queryKey: ['dokument', id],
    queryFn: async () => {
      const res = await apiClient.get(`/dokumente/${id}`);
      return res.data;
    },
  });

  const dokumentType = dokument?.typ || type || 'RE';
  const label = typeLabels[dokumentType as keyof typeof typeLabels] || 'Dokument';
  const editPath = dokumentType === 'AN' ? `/angebote/${id}/edit` : `/rechnungen/${id}/edit`;

  const statusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-emerald-100 text-emerald-800';
      case 'gebucht': return 'bg-blue-100 text-blue-800';
      case 'überfällig': return 'bg-red-100 text-red-800';
      default: return 'bg-zinc-100 text-zinc-800';
    }
  };

  if (isLoading) return <div className="p-6 text-slate-500">Laden...</div>;
  if (!dokument) return <div className="p-6 text-red-500">{label} nicht gefunden</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-zinc-900">{dokument.dokument_nr}</h1>
            <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${statusColor(dokument.status || 'offen')}`}>
              {dokument.status || 'Offen'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {dokument.datum} · {label}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={editPath}
            className="rounded-sm bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Bearbeiten
          </Link>
          <a
            href={`${API_BASE_URL}/dokumente/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            PDF herunterladen
          </a>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="grid grid-cols-4 gap-4 rounded bg-white p-5 outline outline-1 outline-neutral-300">
        <div>
          <div className="text-xs font-normal uppercase tracking-wide text-zinc-700">KUNDE</div>
          <div className="mt-1 text-sm text-zinc-900">
            <Link to={`/stammdaten/kunden/${dokument.kunde_id}`} className="text-sky-600 hover:underline">
              Kunde #{dokument.kunde_id}
            </Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-normal uppercase tracking-wide text-zinc-700">DATUM</div>
          <div className="mt-1 text-sm text-zinc-900">{dokument.datum || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-normal uppercase tracking-wide text-zinc-700">NETTO</div>
          <div className="mt-1 text-sm text-zinc-900">{formatCurrency(dokument.betrag_netto || 0)}</div>
        </div>
        <div>
          <div className="text-xs font-normal uppercase tracking-wide text-zinc-700">BRUTTO</div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">{formatCurrency(dokument.betrag_brutto || 0)}</div>
        </div>
      </div>

      {/* PDF Fehlt Indicator */}
      {!dokument.gedruckt && !dokument.gemailt && (
        <div className="flex items-center gap-2 rounded bg-amber-50 p-4 text-sm text-amber-800 outline outline-1 outline-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>PDF wurde noch nicht generiert. Klicken Sie auf "PDF herunterladen" um es zu erstellen.</span>
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage;
export { DocumentDetailPage };
