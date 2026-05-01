import { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
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

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vorlageId: number) => void;
  dokumentId: number;
  currentVorlageId?: number;
  documentType: string;
}

export default function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelect,
  dokumentId,
  currentVorlageId,
  documentType,
}: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<number | null>(currentVorlageId || null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/vorlagen', { params: { typ: documentType, limit: 100 } })
        .then(res => setTemplates(res.data.items || []))
        .catch(() => setTemplates([]));
    }
  }, [isOpen, documentType]);

  const handlePreview = async (vorlageId: number) => {
    setPreviewing(vorlageId);
    try {
      const res = await apiClient.get(`/dokumente/${dokumentId}/render`, {
        params: { vorlage_id: vorlageId },
      });
      setPreviewHtml(res.data);
    } catch {
      setPreviewHtml('<p>Preview not available</p>');
    }
    setPreviewing(null);
  };

  const handleSelect = async () => {
    if (selected !== null) {
      try {
        await apiClient.put(`/dokumente/${dokumentId}`, { vorlage_id: selected });
        onSelect(selected);
        onClose();
      } catch (error) {
        console.error('Failed to save template selection:', error);
      }
    }
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-sky-950">
                    Vorlage auswählen
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex" style={{ height: '70vh' }}>
                  {/* Template list */}
                  <div className="w-72 overflow-y-auto border-r border-slate-200 p-4">
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSelected(tpl.id)}
                          className={`cursor-pointer rounded border p-3 transition-colors ${
                            selected === tpl.id
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
                              onClick={(e) => { e.stopPropagation(); handlePreview(tpl.id); }}
                              disabled={previewing === tpl.id}
                              className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 disabled:opacity-50"
                            >
                              <EyeIcon className="h-3 w-3" />
                              {previewing === tpl.id ? 'Lädt...' : 'Vorschau'}
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

                  {/* Preview */}
                  <div className="flex-1 bg-slate-100 p-4">
                    {previewHtml ? (
                      <iframe
                        ref={iframeRef}
                        srcDoc={previewHtml}
                        className="h-full w-full rounded border border-slate-300 bg-white"
                        title="Template Preview"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Wählen Sie eine Vorlage und klicken Sie auf "Vorschau"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={onClose}
                    className="rounded px-4 py-2 text-sm font-medium text-slate-700 outline outline-1 outline-slate-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSelect}
                    disabled={selected === null}
                    className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Vorlage anwenden
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
