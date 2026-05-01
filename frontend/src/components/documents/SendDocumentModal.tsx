import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  dokument: {
    id: number;
    typ: 'AN' | 'RE';
    dokument_nr: string;
    kunde_email?: string;
    kunde_name?: string;
  };
}

export default function SendDocumentModal({ isOpen, onClose, dokument }: SendModalProps) {
  const [empfaenger, setEmpfaenger] = useState(dokument.kunde_email || '');
  const [betreff, setBetreff] = useState(
    dokument.typ === 'AN'
      ? `Angebot ${dokument.dokument_nr}`
      : `Rechnung ${dokument.dokument_nr}`
  );
  const [nachricht, setNachricht] = useState(
    `Sehr geehrte/r Kunde,\n\nanbei senden wir Ihnen das gewünschte Dokument.\n\nMit freundlichen Grüßen\nPeters GmbH`
  );
  const [alsPdf, setAlsPdf] = useState(true);
  const [alsWord, setAlsWord] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!empfaenger) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await apiClient.post(`/dokumente/${dokument.id}/send`, {
        empfaenger,
        betreff,
        nachricht,
        als_pdf: alsPdf,
        als_word: alsWord,
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Fehler beim Senden.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-sky-950">
                    Dokument senden
                  </Dialog.Title>
                  <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {sent ? (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <PaperAirplaneIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Gesendet!</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Das Dokument wurde an {empfaenger} gesendet.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="rounded bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                    >
                      Schließen
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 p-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">An (E-Mail)</label>
                      <input
                        type="email"
                        value={empfaenger}
                        onChange={(e) => setEmpfaenger(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                        placeholder="kunde@example.de"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Betreff</label>
                      <input
                        type="text"
                        value={betreff}
                        onChange={(e) => setBetreff(e.target.value)}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Nachricht</label>
                      <textarea
                        value={nachricht}
                        onChange={(e) => setNachricht(e.target.value)}
                        rows={5}
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700">Anhänge</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={alsPdf}
                            onChange={(e) => setAlsPdf(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          PDF
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={alsWord}
                            onChange={(e) => setAlsWord(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          Word (.doc)
                        </label>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={handleClose}
                        className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={sending || !empfaenger}
                        className="flex items-center gap-2 rounded bg-sky-500 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        {sending ? 'Senden...' : 'SENDEN'}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
