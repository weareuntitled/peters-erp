import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import CustomerSearchCombobox from '../../components/search/CustomerSearchCombobox';
import ArticleSearchCombobox from '../../components/search/ArticleSearchCombobox';
import WarengruppeArticleSelector from '../../components/search/WarengruppeArticleSelector';
import apiClient from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';
import PreviewModal from '../../components/documents/PreviewModal';

interface LineItem {
  id: string;
  position_nr: number;
  artikel_id: number | null;
  bezeichnung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  gesamtpreis: number;
  warengruppe_id: number | null;
  warengruppe_name: string;
}

interface Template {
  id: number;
  name: string;
  typ: string;
  ist_standard: number;
}

const QuoteCreationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedKunde = searchParams.get('kunde');
  const queryClient = useQueryClient();

  const routeDocType: 'AN' | 'RE' = location.pathname.startsWith('/rechnungen') ? 'RE' : 'AN';
  const [docType, setDocType] = useState<'AN' | 'RE'>(routeDocType);
  const [selectedKunde, setSelectedKunde] = useState<any>(null);
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [gueltigkeit, setGueltigkeit] = useState('30');
  const [projekt, setProjekt] = useState('');
  const [positionen, setPositionen] = useState<LineItem[]>([]);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [addPositionMode, setAddPositionMode] = useState<'search' | 'browse'>('search');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVorlageId, setSelectedVorlageId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Track dirty state whenever form data or positions change
  useEffect(() => {
    setIsDirty(selectedKunde !== null || positionen.length > 0 || projekt !== '');
  }, [selectedKunde, positionen, projekt]);

  // Warn before closing tab/browser with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  
  // Task 1: Fetch document if editing
  const { data: editingDoc } = useQuery({
    queryKey: ['dokument', id],
    queryFn: async () => {
      const res = await apiClient.get(`/dokumente/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Task 5: Fetch preselected customer
  const { data: preKunde } = useQuery({
    queryKey: ['kunde', preselectedKunde],
    queryFn: async () => {
      const res = await apiClient.get(`/kunden/${preselectedKunde}`);
      return res.data;
    },
    enabled: !!preselectedKunde && !id,
  });

  useEffect(() => {
    if (editingDoc) {
      setDocType(editingDoc.typ as 'AN' | 'RE');
      setDatum(editingDoc.datum || new Date().toISOString().split('T')[0]);
      // setSelectedVorlageId(editingDoc.vorlage_id); // we might not want to override standard if null, but let's do it if it exists
      if (editingDoc.vorlage_id) setSelectedVorlageId(editingDoc.vorlage_id);
      
      if (editingDoc.kunde_id) {
        // We just need enough for the combobox to show it, or fetch full
        // It's better to fetch full customer, but the API might have returned enough
        apiClient.get(`/kunden/${editingDoc.kunde_id}`).then(res => {
          setSelectedKunde(res.data);
        });
      }

      if (editingDoc.positionen) {
        setPositionen(editingDoc.positionen.map((p: any, idx: number) => ({
          id: `pos-${idx}-${Date.now()}`,
          position_nr: p.position_nr,
          artikel_id: p.artikel_id,
          bezeichnung: p.bezeichnung,
          menge: p.menge,
          einheit: p.einheit,
          einzelpreis: p.einzelpreis,
          gesamtpreis: p.gesamtpreis,
          warengruppe_id: p.warengruppe_id,
          warengruppe_name: p.warengruppe_name,
        })));
      }
    }
  }, [editingDoc]);

  useEffect(() => {
    if (preKunde && !id && !selectedKunde) {
      setSelectedKunde(preKunde);
    }
  }, [preKunde, id]);

  const { data: templates } = useQuery({
    queryKey: ['vorlagen', docType],
    queryFn: async () => {
      const res = await apiClient.get('/vorlagen', { params: { typ: docType, limit: 100 } });
      return res.data.items || [];
    },
  });

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedVorlageId) {
      const standard = templates.find((t: Template) => t.ist_standard === 1);
      setSelectedVorlageId(standard ? standard.id : templates[0].id);
    }
  }, [templates]);

  const grouped = positionen.reduce<Record<string, LineItem[]>>((acc, pos) => {
    const wg = pos.warengruppe_name || 'Sonstige';
    if (!acc[wg]) acc[wg] = [];
    acc[wg].push(pos);
    return acc;
  }, {});

  const addPosition = (artikel: any) => {
    const newItem: LineItem = {
      id: `pos-${Date.now()}`,
      position_nr: positionen.length + 1,
      artikel_id: artikel.id === 0 ? null : artikel.id,
      bezeichnung: artikel.label,
      menge: 1,
      einheit: artikel.einheit || 'Stk',
      einzelpreis: artikel.einzelpreis || 0,
      gesamtpreis: artikel.einzelpreis || 0,
      warengruppe_id: artikel.warengruppe_id || null,
      warengruppe_name: artikel.warengruppe || 'Sonstige',
    };
    setPositionen([...positionen, newItem]);
    setShowAddPosition(false);
  };

  const updateEinzelpreis = (id: string, einzelpreis: number) => {
    setPositionen((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, einzelpreis, gesamtpreis: p.menge * einzelpreis } : p
      )
    );
  };

  const updateMenge = (id: string, menge: number) => {
    setPositionen((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, menge, gesamtpreis: menge * p.einzelpreis } : p
      )
    );
  };

  const removePosition = (id: string) => {
    setPositionen((prev) => prev.filter((p) => p.id !== id));
  };

  const netto = positionen.reduce((sum, p) => sum + p.gesamtpreis, 0);
  const mwst = netto * 0.19;
  const brutto = netto + mwst;

  const previewData = {
    typ: docType,
    kunde_id: selectedKunde?.id || null,
    datum,
    gueltigkeit: parseInt(gueltigkeit, 10),
    projekt: projekt || null,
    betrag_netto: netto,
    betrag_brutto: brutto,
    positionen: positionen.map((p, idx) => ({
      position_nr: idx + 1,
      artikel_id: p.artikel_id,
      bezeichnung: p.bezeichnung,
      menge: p.menge,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis,
      gesamtpreis: p.gesamtpreis,
      warengruppe_name: p.warengruppe_name,
    })),
  };

  const saveAsDraft = useMutation({
    mutationFn: async () => {
      const payload = {
        typ: docType,
        kunde_id: selectedKunde?.id,
        datum,
        gueltigkeit: parseInt(gueltigkeit, 10),
        projekt: projekt || null,
        betrag_netto: netto,
        betrag_brutto: brutto,
        status: 'entwurf',
        vorlage_id: selectedVorlageId,
        positionen: positionen.map((p, idx) => ({
          position_nr: idx + 1,
          artikel_id: p.artikel_id,
          bezeichnung: p.bezeichnung,
          menge: p.menge,
          einheit: p.einheit,
          einzelpreis: p.einzelpreis,
          gesamtpreis: p.gesamtpreis,
          warengruppe_id: p.warengruppe_id,
          warengruppe_name: p.warengruppe_name,
        })),
      };
      const res = id 
        ? await apiClient.put(`/dokumente/${id}`, payload)
        : await apiClient.post('/dokumente/', payload);
      return res.data;
    },
  });

  const confirmDocument = useMutation({
    mutationFn: async (dokumentId: number) => {
      await apiClient.put(`/dokumente/${dokumentId}`, { status: 'offen', vorlage_id: selectedVorlageId });
      return dokumentId;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['dokumente'] });
      queryClient.invalidateQueries({ queryKey: ['angebote'] });
      queryClient.invalidateQueries({ queryKey: ['rechnungen'] });
      queryClient.invalidateQueries({ queryKey: ['kunde-rechnungen'] });
      queryClient.invalidateQueries({ queryKey: ['kunde-angebote'] });
      navigate(docType === 'AN' ? `/angebote/${id}` : `/rechnungen/${id}`);
    },
  });

  const handleSaveAsDraft = async () => {
    if (!selectedKunde) {
      alert('Bitte wahlen Sie einen Kunden aus.');
      return;
    }
    try {
      const result = await saveAsDraft.mutateAsync();
      return result.id;
    } catch {
      alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
      return null;
    }
  };

  const handleConfirm = async () => {
    if (!selectedKunde) {
      alert('Bitte wahlen Sie einen Kunden aus.');
      return;
    }
    try {
      const result = await saveAsDraft.mutateAsync();
      if (result?.id) {
        await confirmDocument.mutateAsync(result.id);
      }
    } catch {
      alert('Fehler beim Bestätigen. Bitte versuchen Sie es erneut.');
    }
  };

  const previewPayload = {
      typ: 'AN',
      kunde_id: selectedKunde?.id,
      datum: new Date().toISOString().split('T')[0],
      betrag_netto: netto,
      betrag_brutto: brutto,
      vorlage_id: selectedVorlageId,
      positionen: positionen.map((p, idx) => ({
        position_nr: idx + 1,
        artikel_id: p.artikel_id,
        bezeichnung: p.bezeichnung,
        menge: p.menge,
        einheit: p.einheit,
        einzelpreis: p.einzelpreis,
        gesamtpreis: p.gesamtpreis,
        warengruppe_id: p.warengruppe_id,
        warengruppe_name: p.warengruppe_name,
      })),
    };

  const handleNavigateBack = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscardAndLeave = () => {
    setShowDiscardModal(false);
    setIsDirty(false);
    navigate(-1);
  };

  const handleSaveDraftAndLeave = async () => {
    const id = await handleSaveAsDraft();
    if (id) {
      setIsDirty(false);
      setShowDiscardModal(false);
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={handleNavigateBack} className="text-sm text-slate-500 hover:text-slate-700">
          ← Zurück
        </button>
      </div>

      {/* Document Type Toggle + Template Selection */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setDocType('AN')}
            className={`rounded px-4 py-2 text-sm font-semibold ${
              docType === 'AN' ? 'bg-sky-500 text-white' : 'bg-white text-slate-700 outline outline-1 outline-slate-200'
            }`}
          >
            Angebot
          </button>
          <button
            onClick={() => setDocType('RE')}
            className={`rounded px-4 py-2 text-sm font-semibold ${
              docType === 'RE' ? 'bg-sky-500 text-white' : 'bg-white text-slate-700 outline outline-1 outline-slate-200'
            }`}
          >
            Rechnung
          </button>
        </div>
        <select
          value={selectedVorlageId || ''}
          onChange={(e) => setSelectedVorlageId(Number(e.target.value))}
          className="w-48 rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        >
          <option value="">— Standard verwenden —</option>
          {templates?.map((tpl: Template) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name} {tpl.ist_standard === 1 ? '(Standard)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Customer Selection */}
      <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Kunde auswählen</h3>
        <CustomerSearchCombobox
          onSelect={setSelectedKunde}
          selectedKunde={selectedKunde}
          onClear={() => setSelectedKunde(null)}
        />
      </div>

      {/* Document Info */}
      <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Dokumenteninformationen</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Nummer</label>
            <input
              type="text"
              value={`${docType}-2026-XXX`}
              disabled
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Gültigkeit (Tage)</label>
            <input
              type="number"
              value={gueltigkeit}
              onChange={(e) => setGueltigkeit(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Positionen</h3>

        {Object.entries(grouped).map(([wgName, items]) => (
          <div key={wgName} className="mb-4">
            <div className="mb-2 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-600">
              {wgName}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="w-12 px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">POS</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">BESCHREIBUNG</th>
                  <th className="w-20 px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">MENGE</th>
                  <th className="w-20 px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">EINHEIT</th>
                  <th className="w-28 px-3 py-2 text-right text-xs font-bold uppercase text-slate-500">PREIS</th>
                  <th className="w-28 px-3 py-2 text-right text-xs font-bold uppercase text-slate-500">GESAMT</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((pos, idx) => (
                  <tr key={pos.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs text-slate-900">{idx + 1}</td>
                    <td className="px-3 py-2 text-xs text-slate-900">{pos.bezeichnung}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={pos.menge}
                        onChange={(e) => updateMenge(pos.id, Number(e.target.value))}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{pos.einheit}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={pos.einzelpreis}
                        onChange={(e) => updateEinzelpreis(pos.id, Number(e.target.value))}
                        className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-slate-900">{formatCurrency(pos.gesamtpreis)}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => removePosition(pos.id)} className="text-red-500 hover:text-red-700">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {showAddPosition && (
          <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-700">Artikel hinzufügen</h4>
              <div className="flex rounded border border-slate-200 bg-white text-xs">
                <button
                  onClick={() => setAddPositionMode('search')}
                  className={`px-3 py-1.5 ${addPositionMode === 'search' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Suchen
                </button>
                <button
                  onClick={() => setAddPositionMode('browse')}
                  className={`px-3 py-1.5 ${addPositionMode === 'browse' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Nach Warengruppe
                </button>
              </div>
            </div>
            {addPositionMode === 'search' ? (
              <ArticleSearchCombobox onSelect={addPosition} />
            ) : (
              <WarengruppeArticleSelector onSelect={addPosition} onClose={() => setShowAddPosition(false)} />
            )}
          </div>
        )}

        <button
          onClick={() => setShowAddPosition(!showAddPosition)}
          className="mt-4 rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          + Position hinzufügen
        </button>
      </div>

      

      {/* Summary */}
      <div className="rounded bg-white p-5 outline outline-1 outline-slate-200">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Zusammenfassung</h3>
        <div className="space-y-2">
          {Object.entries(grouped).map(([wgName, items]) => {
            const wgTotal = items.reduce((sum, p) => sum + p.gesamtpreis, 0);
            return (
              <div key={wgName} className="flex justify-between text-sm">
                <span className="text-slate-600">{wgName}</span>
                <span className="font-medium text-slate-900">{formatCurrency(wgTotal)}</span>
              </div>
            );
          })}
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Zwischensumme netto</span>
              <span className="font-medium text-slate-900">{formatCurrency(netto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Umsatzsteuer (19%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(mwst)}</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between text-base font-semibold">
              <span>Gesamtbetrag brutto</span>
              <span>{formatCurrency(brutto)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowPreview(true)}
          disabled={!selectedKunde || positionen.length === 0}
          className="flex items-center gap-2 rounded border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Vorschau
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedKunde || positionen.length === 0}
          className="rounded bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
        >
          Speichern & Bestätigen
        </button>
      </div>

      {showPreview && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={(vorlageId) => {
            if (vorlageId) setSelectedVorlageId(vorlageId);
          }}
          documentType={docType}
          previewData={previewPayload}
        />
      )}
      {/* Discard Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Ungespeicherte Änderungen</h3>
            <p className="mb-6 text-sm text-slate-600">
              Sie haben ungespeicherte Änderungen. Möchten Sie diese speichern, verwerfen oder bleiben?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bleiben
              </button>
              <button
                onClick={handleDiscardAndLeave}
                className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Verwerfen
              </button>
              <button
                onClick={handleSaveDraftAndLeave}
                className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
              >
                Als Entwurf speichern
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuoteCreationPage;
