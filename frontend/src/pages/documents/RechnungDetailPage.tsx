import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ExclamationTriangleIcon, 
  PencilIcon, 
  PaperAirplaneIcon, 
  ArrowDownTrayIcon, 
  EllipsisVerticalIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import apiClient, { API_BASE_URL } from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';
import SendDocumentModal from '../../components/documents/SendDocumentModal';

const typeLabels: Record<string, string> = {
  RE: 'Rechnung',
  AN: 'Angebot',
  LI: 'Lieferschein',
  MA: 'Mahnung',
  ST: 'Stornierung',
  AU: 'Auftrag',
  GU: 'Gutschrift',
};

const RechnungDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPdf, setShowPdf] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: rechnung, isLoading: isDocLoading } = useQuery({
    queryKey: ['dokument', id],
    queryFn: async () => {
      const res = await apiClient.get(`/dokumente/${id}`);
      return res.data;
    },
  });

  const { data: kunde, isLoading: isKundeLoading } = useQuery({
    queryKey: ['kunde', rechnung?.kunde_id],
    enabled: !!rechnung?.kunde_id,
    queryFn: async () => {
      const res = await apiClient.get(`/kunden/${rechnung.kunde_id}`);
      return res.data;
    },
  });

  const { data: positionen, isLoading: isPosLoading } = useQuery({
    queryKey: ['positionen', id],
    queryFn: async () => {
      const res = await apiClient.get('/positionen', { params: { dokument_id: id } });
      return res.data;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/dokumente/${id}/status`, null, { params: { status: 'bezahlt' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dokument', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (window.confirm("Möchten Sie dieses Dokument wirklich löschen?")) {
        await apiClient.delete(`/dokumente/${id}`);
        return true;
      }
      return false;
    },
    onSuccess: (deleted) => {
      if (deleted) {
        queryClient.invalidateQueries({ queryKey: ['dokumente'] });
        navigate('/rechnungen');
      }
    },
  });

  const stornoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/dokumente/${id}/convert`, null, { params: { new_typ: 'ST' } });
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/storno/${data.id}`);
    },
  });

  if (isDocLoading || isKundeLoading || isPosLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Laden...</div>;
  }

  if (!rechnung) {
    return <div className="p-6 text-red-500">Rechnung nicht gefunden</div>;
  }

  const statusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'bezahlt': return 'bg-emerald-100 text-emerald-800';
      case 'überfällig': return 'bg-red-100 text-red-800';
      case 'storniert': return 'bg-red-50 text-red-700';
      default: return 'bg-zinc-100 text-zinc-800';
    }
  };

  const label = typeLabels[rechnung.typ] || 'Dokument';

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      {/* Page Header & Actions */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              {rechnung.typ} #{rechnung.dokument_nr}
            </h1>
            <span className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor(rechnung.status)}`}>
              {rechnung.status || 'Offen'}
            </span>
          </div>
          <p className="text-sm text-slate-500">Erstellt am {rechnung.datum}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/rechnungen/${id}/edit`)}
            className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <PencilIcon className="h-4 w-4" /> Bearbeiten
          </button>
          {rechnung.status !== 'bezahlt' && rechnung.typ === 'RE' && (
            <button 
              onClick={() => markPaidMutation.mutate()}
              className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Mark Paid
            </button>
          )}
          <a
            href={`${API_BASE_URL}/dokumente/${id}/pdf`}
            className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> PDF herunterladen
          </a>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" /> Senden
          </button>
          <div className="relative group">
            <button className="flex items-center justify-center rounded border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 transition-colors">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-48 rounded border border-slate-200 bg-white py-1 shadow-lg group-hover:block z-10">
                <button 
                  onClick={() => stornoMutation.mutate()}
                  className="flex w-full items-center px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                >
                  Stornieren
                </button>
                <button 
                  onClick={() => deleteMutation.mutate()}
                  className="flex w-full items-center px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                >
                  Löschen
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gesamtbetrag</span>
          <span className="font-heading text-xl font-bold text-slate-900">{formatCurrency(rechnung.betrag_brutto || 0)}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Offen</span>
          <span className="font-heading text-xl font-bold text-slate-900">
            {rechnung.status === 'bezahlt' ? formatCurrency(0) : formatCurrency(rechnung.betrag_brutto || 0)}
          </span>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Belegdatum</span>
          <span className="font-heading text-lg font-semibold text-slate-900">{rechnung.datum}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fällig am</span>
          <span className="font-heading text-lg font-semibold text-slate-900">{rechnung.liefertermin || '—'}</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* Details Row */}
          <div className="grid grid-cols-2 gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Bill To */}
            <div className="flex flex-col gap-4">
              <h3 className="border-b border-slate-100 pb-2 font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Rechnungsempfänger</h3>
              <div className="flex flex-col gap-1 text-sm text-slate-600">
                <strong className="text-base font-semibold text-slate-900">{kunde?.name || `Kunde #${rechnung.kunde_id}`}</strong>
                <span>{kunde?.strasse}</span>
                <span>{kunde?.plz} {kunde?.ort}</span>
                <span className="mt-2 text-sky-600">{kunde?.email}</span>
              </div>
            </div>
            {/* Invoice Info */}
            <div className="flex flex-col gap-4">
              <h3 className="border-b border-slate-100 pb-2 font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Informationen</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Zahlungsziel:</span>
                  <span className="font-semibold text-slate-900">Netto 14 Tage</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Währung:</span>
                  <span className="font-semibold text-slate-900">EUR (€)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Projekt:</span>
                  <span className="font-semibold text-slate-900">{rechnung.auftragsbezeichnung || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Positionen</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="py-3 px-6">Pos</th>
                  <th className="py-3 px-6">Beschreibung</th>
                  <th className="py-3 px-6 text-right">Menge</th>
                  <th className="py-3 px-6 text-right">Einzelpreis</th>
                  <th className="py-3 px-6 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700">
                {positionen?.map((pos: any) => (
                  <tr key={pos.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6">{pos.position_nr}</td>
                    <td className="py-3 px-6 font-medium text-slate-900">{pos.bezeichnung}</td>
                    <td className="py-3 px-6 text-right">{pos.menge} {pos.einheit}</td>
                    <td className="py-3 px-6 text-right">{formatCurrency(pos.einzelpreis)}</td>
                    <td className="py-3 px-6 text-right font-semibold text-slate-900">{formatCurrency(pos.gesamtpreis)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals Section */}
            <div className="flex justify-end bg-slate-50 px-6 py-6 border-t border-slate-200">
              <div className="w-64 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Netto</span>
                  <span>{formatCurrency(rechnung.betrag_netto || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>MwSt. (19%)</span>
                  <span>{formatCurrency((rechnung.betrag_brutto || 0) - (rechnung.betrag_netto || 0))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 font-heading text-lg font-bold text-slate-900">
                  <span>Brutto</span>
                  <span>{formatCurrency(rechnung.betrag_brutto || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Activity History (Mocked from doc state) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Verlauf</h3>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
              {rechnung.status === 'bezahlt' && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Als bezahlt markiert</span>
                    <span className="text-[10px] text-slate-400">Abgeschlossen</span>
                  </div>
                </div>
              )}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-sky-500 border-2 border-white shadow-sm"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{label} erstellt</span>
                  <span className="text-[10px] text-slate-400">{rechnung.datum} am System</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Documents (Mock) */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Verknüpfte Belege</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded border border-slate-100 p-3 text-slate-400">
                <span className="text-[10px]">Keine Verknüpfungen vorhanden</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Fehlt Indicator */}
      {!rechnung.gedruckt && !rechnung.gemailt && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>Diese Rechnung wurde noch nicht gedruckt oder versendet.</span>
        </div>
      )}

      {showSendModal && (
        <SendDocumentModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          dokument={{
            id: rechnung.id,
            typ: rechnung.typ,
            dokument_nr: rechnung.dokument_nr,
            kunde_email: kunde?.email,
            kunde_name: kunde?.name,
          }}
        />
      )}
    </div>
  );
};

export default RechnungDetailPage;
