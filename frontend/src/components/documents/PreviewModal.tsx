import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';

interface Template {
  id: number;
  name: string;
  typ: string;
  kopftext: string | null;
  fusstext: string | null;
  template_datei: string | null;
  mit_zwischensumme: number;
  mit_einzelpreisen: number;
  mit_positionsnummern: number;
  ist_standard: number;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (vorlageId: number | null) => void;
  documentType: 'AN' | 'RE';
  previewData: {
    typ: 'AN' | 'RE';
    kunde_id: number | null;
    datum: string;
    gueltigkeit: number;
    projekt: string | null;
    betrag_netto: number;
    betrag_brutto: number;
    positionen: Array<{
      position_nr: number;
      artikel_id: number | null;
      bezeichnung: string;
      menge: number;
      einheit: string;
      einzelpreis: number;
      gesamtpreis: number;
    }>;
  };
}

export default function PreviewModal({
  isOpen,
  onClose,
  onConfirm,
  documentType,
  previewData,
}: PreviewModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedVorlageId, setSelectedVorlageId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/vorlagen', { params: { typ: documentType, limit: 100 } })
        .then(res => {
          const items = res.data.items || [];
          setTemplates(items);
          if (items.length > 0 && !selectedVorlageId) {
            const standard = items.find((t: Template) => t.ist_standard === 1);
            setSelectedVorlageId(standard ? standard.id : items[0].id);
          }
        })
        .catch(() => setTemplates([]));
    }
  }, [isOpen, documentType]);

  useEffect(() => {
    if (isOpen && selectedVorlageId) {
      handlePreview();
    }
  }, [selectedVorlageId, isOpen]);

  const handlePreview = async () => {
    if (!selectedVorlageId) return;
    setPreviewing(true);
    try {
      const res = await apiClient.post('/dokumente/preview', {
        ...previewData,
        vorlage_id: selectedVorlageId,
      });
      setPreviewHtml(res.data);
    } catch {
      setPreviewHtml('<p>Vorschau nicht verfügbar</p>');
    }
    setPreviewing(false);
  };

  const handleConfirm = () => {
    onConfirm(selectedVorlageId);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-sky-950">
                    Vorschau — {documentType === 'AN' ? 'Angebot' : 'Rechnung'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex" style={{ height: '70vh' }}>
                  <div className="w-72 overflow-y-auto border-r border-slate-200 p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Vorlage auswählen
                    </h4>
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedVorlageId(tpl.id)}
                          className={`cursor-pointer rounded border p-3 transition-colors ${
                            selectedVorlageId === tpl.id
                              ? 'border-sky-500 bg-sky-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900">{tpl.name}</span>
                            {tpl.ist_standard === 1 && (
                              <span className="text-xs text-sky-600">Standard</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {tpl.mit_zwischensumme === 1 && (
                              <span className="text-xs text-slate-400">Zwischensumme</span>
                            )}
                            {tpl.mit_positionsnummern === 1 && (
                              <span className="text-xs text-slate-400">Pos.Nr.</span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePreview(); }}
                              disabled={previewing}
                              className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 disabled:opacity-50"
                            >
                              <EyeIcon className="h-3 w-3" />
                              {previewing ? 'Lädt...' : 'Aktualisieren'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <p className="py-4 text-center text-sm text-slate-500">
                          Keine Vorlagen für {documentType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-100 p-4">
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        className="h-full w-full rounded border border-slate-300 bg-white"
                        title="Document Preview"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Klicken Sie auf "Aktualisieren" um die Vorschau zu laden
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={onClose}
                    className="rounded px-4 py-2 text-sm font-medium text-slate-700 outline outline-1 outline-slate-300"
                  >
                    Abbrechen
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handlePreview}
                      disabled={previewing || !selectedVorlageId}
                      className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Aktualisieren
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="rounded bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                    >
                      BESTÄTIGEN → In Bearbeitung
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
