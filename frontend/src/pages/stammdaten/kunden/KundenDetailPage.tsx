import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';

const KundenDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'dokumente'>('uebersicht');

  const { data: kunde, isLoading } = useQuery({
    queryKey: ['kunde', id],
    queryFn: async () => {
      const res = await apiClient.get(`/kunden/${id}`);
      return res.data;
    },
  });

  const { data: rechnungen } = useQuery({
    queryKey: ['kunde-rechnungen', id],
    queryFn: async () => {
      const res = await apiClient.get('/dokumente', { params: { kunde_id: id, typ: 'RE' } });
      return res.data.items || [];
    },
    enabled: !!id,
  });

  const { data: angebote } = useQuery({
    queryKey: ['kunde-angebote', id],
    queryFn: async () => {
      const res = await apiClient.get('/dokumente', { params: { kunde_id: id, typ: 'AN' } });
      return res.data.items || [];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-slate-500">Laden...</div>;
  if (!kunde) return <div className="p-6 text-red-500">Kunde nicht gefunden</div>;

  const allDocs = [...(angebote || []), ...(rechnungen || [])].sort((a, b) => {
    const dateA = a.datum || '';
    const dateB = b.datum || '';
    return dateB.localeCompare(dateA);
  });

  const tabs = [
    { key: 'uebersicht' as const, label: 'Übersicht' },
    { key: 'dokumente' as const, label: 'Dokumente' },
  ];

  const statusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'bezahlt': return 'bg-emerald-500';
      case 'offen': return 'bg-sky-500';
      case 'verschickt': return 'bg-blue-500';
      case 'storniert': return 'bg-red-500';
      case 'entwurf': return 'bg-zinc-400';
      default: return 'bg-zinc-500';
    }
  };

  const typeLabel = (typ: string) => {
    switch (typ) {
      case 'RE': return 'Rechnung';
      case 'AN': return 'Angebot';
      case 'LI': return 'Lieferschein';
      case 'ST': return 'Storno';
      default: return typ;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold leading-9 text-zinc-900">
              {kunde.name || `${kunde.vorname} ${kunde.name}`}
            </h1>
            <span className="rounded-sm bg-blue-100 px-2 py-1 text-xs font-semibold tracking-tight text-slate-600">
              Aktiv
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="text-sm leading-5 text-zinc-700">{kunde.kundnr}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/stammdaten/kunden/${id}/edit`}
            className="rounded-sm px-4 py-2 text-xs font-semibold tracking-tight text-zinc-900 outline outline-1 outline-slate-200"
          >
            Bearbeiten
          </Link>
          <Link
            to={`/angebote/new?kunde=${id}`}
            className="rounded-sm px-4 py-2 text-xs font-semibold tracking-tight text-zinc-900 outline outline-1 outline-slate-200"
          >
            Dokument erstellen
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-neutral-300">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 pb-3 text-xs font-semibold tracking-tight ${
              activeTab === tab.key
                ? 'border-b-2 border-sky-950 text-sky-950'
                : 'border-b-2 border-transparent text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'uebersicht' && (
        <div className="flex flex-col gap-3.5">
          {/* Hauptansprechpartner */}
          <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
            <h2 className="mb-6 font-heading text-xl font-semibold leading-7 text-zinc-900">
              Hauptansprechpartner
            </h2>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-300 bg-slate-100 text-xl font-semibold text-slate-600">
                {(kunde.vorname?.[0] || '')}{(kunde.name?.[0] || '')}
              </div>
              <div>
                <div className="font-heading text-lg font-semibold leading-7 text-zinc-900">
                  {kunde.vorname} {kunde.name}
                </div>
                <div className="text-sm leading-5 text-zinc-700">Geschäftsführer</div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {kunde.email && (
                <div className="flex items-center gap-3 rounded-sm bg-slate-50 p-3 outline outline-1 outline-slate-200">
                  <span className="text-[10px] font-normal uppercase leading-4 tracking-wide text-zinc-700">E-MAIL</span>
                  <span className="text-xs font-medium leading-4 text-sky-950">{kunde.email}</span>
                </div>
              )}
              {kunde.ort && (
                <div className="flex items-center gap-3 rounded-sm bg-slate-50 p-3 outline outline-1 outline-slate-200">
                  <span className="text-[10px] font-normal uppercase leading-4 tracking-wide text-zinc-700">ORT</span>
                  <span className="text-xs font-medium leading-4 text-zinc-900">{kunde.ort}</span>
                </div>
              )}
              {kunde.telefon && (
                <div className="flex items-center gap-3 rounded-sm bg-slate-50 p-3 outline outline-1 outline-slate-200">
                  <span className="text-[10px] font-normal uppercase leading-4 tracking-wide text-zinc-700">TELEFON</span>
                  <span className="text-xs font-medium leading-4 text-zinc-900">{kunde.telefon}</span>
                </div>
              )}
              {kunde.mobil && (
                <div className="flex items-center gap-3 rounded-sm bg-slate-50 p-3 outline outline-1 outline-slate-200">
                  <span className="text-[10px] font-normal uppercase leading-4 tracking-wide text-zinc-700">MOBIL</span>
                  <span className="text-xs font-medium leading-4 text-zinc-900">{kunde.mobil}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stammdaten */}
          <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
            <h2 className="mb-6 font-heading text-xl font-semibold leading-7 text-zinc-900">
              Stammdaten
            </h2>
            <div className="flex gap-3.5">
              <div>
                <div className="text-xs font-normal uppercase leading-4 tracking-wide text-zinc-700">ADRESSE</div>
                <div className="mt-1 text-[10px] leading-5 text-zinc-900">
                  {kunde.strasse}<br />
                  {kunde.plz} {kunde.ort}<br />
                  {kunde.land || 'Deutschland'}
                </div>
              </div>
              {kunde.kundengruppe && (
                <div>
                  <div className="text-xs font-normal uppercase leading-4 tracking-wide text-zinc-700">BRANCHE</div>
                  <div className="mt-1 text-[10px] leading-4 text-zinc-900">{kunde.kundengruppe}</div>
                </div>
              )}
              {kunde.kennung1 && (
                <div>
                  <div className="text-xs font-normal uppercase leading-4 tracking-wide text-zinc-700">STEUER-ID</div>
                  <div className="mt-1 text-[10px] leading-4 text-zinc-900">{kunde.kennung1}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dokumente' && (
        <div className="rounded bg-white outline outline-1 outline-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-gray-100">
                <th className="px-3 py-3 text-left text-xs font-bold uppercase text-zinc-700">TYP</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase text-zinc-700">STATUS</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase text-zinc-700">NR</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase text-zinc-700">DATUM</th>
                <th className="px-3 py-3 text-right text-xs font-bold uppercase text-zinc-700">BETRAG</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-zinc-700">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {allDocs.map((doc: any) => (
                <tr key={doc.id} className="border-b border-zinc-200">
                  <td className="px-3 py-2.5 text-sm font-medium text-zinc-900">{typeLabel(doc.typ)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block h-3.5 w-3.5 rounded-full ${statusColor(doc.status)}`} />
                  </td>
                  <td className="px-3 py-2.5 text-sm font-medium text-zinc-900">{doc.dokument_nr}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-700">{doc.datum || '—'}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-zinc-900">{formatCurrency(doc.betrag_brutto || 0)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link to={doc.typ === 'AN' ? `/angebote/${doc.id}` : `/rechnungen/${doc.id}`} className="text-zinc-500 hover:text-zinc-700">→</Link>
                  </td>
                </tr>
              ))}
              {allDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Keine Dokumente gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KundenDetailPage;
