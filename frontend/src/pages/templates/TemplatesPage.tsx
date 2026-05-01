import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import warengruppenService, { Warengruppe } from '../../api/warengruppenService';
import useTranslation from '../../hooks/useTranslation';

interface Vorlage {
  id: number;
  name: string;
  typ: string;
  warengruppe_id: number | null;
  template_datei: string | null;
  kopftext: string | null;
  fusstext: string | null;
  aktiv: number;
  ist_standard: number;
}

interface PaginatedResponse {
  items: Vorlage[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const TYP_LABELS: Record<string, string> = {
  'AN': 'Angebot',
  'RE': 'Rechnung',
  'LI': 'Lieferschein',
  'GU': 'Gutschrift',
  'MA': 'Mahnung',
  'AU': 'Auftrag',
  'BE': 'Bestellung',
  'BA': 'Bestellanfrage',
  'ST': 'Stornierung',
};

const TemplatesPage = () => {
  const { t } = useTranslation();
  const [typFilter, setTypFilter] = useState<string>('');
  const [selectedWarengruppe, setSelectedWarengruppe] = useState<number | null>(null);

  const { data: warengruppen } = useQuery<Warengruppe[]>({
    queryKey: ['warengruppen'],
    queryFn: warengruppenService.getAll,
  });

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['vorlagen', typFilter],
    queryFn: async () => {
      const typParam = typFilter ? `&typ=${typFilter}` : '';
      const response = await apiClient.get(
        `/vorlagen?limit=100${typParam}`
      );
      return response.data;
    },
  });

  const getWarengruppeLabel = (id: number | null) => {
    if (!id || !warengruppen) return null;
    const wg = warengruppen.find(w => w.id === id);
    return wg?.bezeichnung || null;
  };

  const filteredVorlagen = selectedWarengruppe
    ? data?.items.filter(v => v.warengruppe_id === selectedWarengruppe)
    : data?.items;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('errors.connectionError')}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('templates.title')}
        </h1>
      </div>

      {/* Leistungen (Warengruppen) Section */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold">{t('leistungen.title')}</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t('leistungen.description')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedWarengruppe(null)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedWarengruppe === null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Alle Leistungen
          </button>
          {warengruppen?.map((wg) => (
            <button
              key={wg.id}
              onClick={() => setSelectedWarengruppe(wg.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedWarengruppe === wg.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {wg.bezeichnung}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setTypFilter('')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !typFilter
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Alle
        </button>
        {Object.entries(TYP_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypFilter(typFilter === key ? '' : key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              typFilter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {t('common.loading')}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            {t('common.noResults')}
          </div>
        ) : (
          filteredVorlagen?.map((vorlage) => (
            <div
              key={vorlage.id}
              className="rounded-lg bg-white p-6 shadow dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="mb-2 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {TYP_LABELS[vorlage.typ] || vorlage.typ}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vorlage.name}
                  </h3>
                  {getWarengruppeLabel(vorlage.warengruppe_id) && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      {getWarengruppeLabel(vorlage.warengruppe_id)}
                    </p>
                  )}
                  {vorlage.template_datei && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vorlage.template_datei}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {vorlage.ist_standard === 1 && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      Standard
                    </span>
                  )}
                  {vorlage.aktiv === 1 ? (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Aktiv
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Inaktiv</span>
                  )}
                </div>
              </div>

              {vorlage.kopftext && (
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                  <strong>Kopf:</strong> {vorlage.kopftext.substring(0, 50)}...
                </p>
              )}

              {vorlage.fusstext && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <strong>Fuß:</strong> {vorlage.fusstext.substring(0, 50)}...
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/templates/${vorlage.id}`}
                  className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Bearbeiten
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
