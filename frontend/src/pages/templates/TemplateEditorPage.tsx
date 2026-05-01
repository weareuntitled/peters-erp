import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import useTranslation from '../../hooks/useTranslation';

interface Vorlage {
  id: number;
  name: string;
  typ: string;
  template_datei: string | null;
  kopftext: string | null;
  fusstext: string | null;
  html_content: string | null;
  mit_zwischensumme: number;
  mit_einzelpreisen: number;
  mit_positionsnummern: number;
}

const TemplateEditorPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const [htmlContent, setHtmlContent] = useState('');
  const [kopftext, setKopftext] = useState('');
  const [fusstext, setFusstext] = useState('');

  // Fetch template
  const { data: vorlage, isLoading } = useQuery<Vorlage>({
    queryKey: ['vorlage', id],
    queryFn: async () => {
      const response = await apiClient.get(`/vorlagen/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Update form when template loads
  useEffect(() => {
    if (vorlage) {
      setHtmlContent(vorlage.html_content || '');
      setKopftext(vorlage.kopftext || '');
      setFusstext(vorlage.fusstext || '');
    }
  }, [vorlage]);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!htmlContent) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await apiClient.post('/vorlagen/preview/render', {
        html_content: htmlContent,
        typ: vorlage?.typ || 'AN',
        dokument_nr: 'VORSCHAU-001',
        datum: new Date().toLocaleDateString('de-DE'),
        kopftext,
        fusstext,
        kunde_name: 'Max Mustermann',
        kunde_strasse: 'Musterstraße 123',
        kunde_plz_ort: '80331 München',
        kundnr: '10019',
        positionen: [
          {
            bezeichnung: 'Baustelleneinrichtung mit Aufzug',
            menge: 1,
            einheit: 'Stk',
            einzelpreis: 10109.97,
            gesamtpreis: 10109.97,
          },
        ],
        betrag_netto: 10109.97,
        betrag_brutto: 12030.86,
      });
      setPreviewHtml(res.data);
    } catch (err: any) {
      setPreviewError(err?.response?.data || 'Vorschau fehlgeschlagen');
      setPreviewHtml(null);
    }
    setPreviewLoading(false);
  }, [htmlContent, kopftext, fusstext, vorlage?.typ]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Vorlage>) => {
      await apiClient.put(`/vorlagen/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vorlage', id] });
      queryClient.invalidateQueries({ queryKey: ['vorlagen'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      html_content: htmlContent,
      kopftext,
      fusstext,
    });
  };

  const initFromDiskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/vorlagen/${id}/init-template`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vorlage', id] });
      if (data?.html_content_length) {
        alert(`Template geladen (${data.html_content_length} Zeichen). Bitte Vorschau prüfen.`);
      }
    },
    onError: () => {
      alert('Fehler beim Laden des Templates.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (!vorlage) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Vorlage nicht gefunden
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/templates')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vorlage.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vorlage bearbeiten
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!vorlage.html_content && (
            <button
              onClick={() => initFromDiskMutation.mutate()}
              disabled={initFromDiskMutation.isPending}
              className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
            >
              {initFromDiskMutation.isPending ? 'Laden...' : 'Vom Datenträger laden'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'edit'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Bearbeiten
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Vorschau
        </button>
      </div>

      {/* Content */}
      {activeTab === 'edit' ? (
        <div className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Settings */}
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
              Einstellungen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kopftext
                </label>
                <textarea
                  value={kopftext}
                  onChange={(e) => setKopftext(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Sehr geehrte Damen und Herren,"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fußtext
                </label>
                <textarea
                  value={fusstext}
                  onChange={(e) => setFusstext(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Mit freundlichen Grüßen"
                />
              </div>
            </div>
          </div>

          {/* Right: HTML Editor */}
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
              HTML-Quelltext
            </h3>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={20}
              className="font-mono block w-full rounded-md border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              placeholder="<html>..."
            />
            <p className="mt-2 text-xs text-gray-500">
              Variablen: $kundnr, $name, $vorname, $datum, $aufnr, $briefanrede, $positionen, $summenetto, $summesteuer, $summebrutto, $waehrung
            </p>
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="flex-1 rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vorschau mit Beispieldaten
            </p>
            <button
              onClick={fetchPreview}
              disabled={previewLoading}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {previewLoading ? 'Lädt...' : 'Aktualisieren'}
            </button>
          </div>
          {previewError && (
            <div className="p-4 text-sm text-red-600">{previewError}</div>
          )}
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="h-[calc(100vh-350px)] w-full border-0"
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          ) : !previewError ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              Klicken Sie "Aktualisieren" um die Vorschau zu laden
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TemplateEditorPage;
