import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

const VorlagenPage = () => {
  const [typ, setTyp] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vorlagen', typ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (typ) params.typ = typ;
      const res = await apiClient.get('/vorlagen', { params });
      return res.data.items || res.data;
    },
  });

  const typLabels: Record<string, string> = {
    AN: 'Angebot',
    RE: 'Rechnung',
    ST: 'Storno',
  };

  const typColors: Record<string, string> = {
    AN: 'bg-blue-100 text-blue-800',
    RE: 'bg-emerald-100 text-emerald-800',
    ST: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-slate-400">Stammdaten</span>
            <span className="text-xs text-slate-400">›</span>
            <span className="text-xs font-semibold tracking-tight text-sky-950">Vorlagen</span>
          </div>
          <h1 className="font-heading text-base font-normal leading-6 text-sky-950">
            Dokumentvorlagen
          </h1>
        </div>
        <div className="flex gap-3">
          <select
            value={typ}
            onChange={(e) => setTyp(e.target.value)}
            className="rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
          >
            <option value="">Alle Typen</option>
            <option value="AN">Angebote</option>
            <option value="RE">Rechnungen</option>
            <option value="ST">Storno</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {data?.map((vorlage: any) => (
          <div
            key={vorlage.id}
            className="rounded bg-white p-5 outline outline-1 outline-slate-200"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-heading text-base font-semibold text-zinc-900">
                {vorlage.name}
              </h3>
              <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${typColors[vorlage.typ] || 'bg-gray-100 text-gray-800'}`}>
                {typLabels[vorlage.typ] || vorlage.typ}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {vorlage.beschreibung || 'Keine Beschreibung'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className={`inline-block h-2 w-2 rounded-full ${vorlage.aktiv ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
              {vorlage.aktiv ? 'Aktiv' : 'Inaktiv'}
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="col-span-3 py-8 text-center text-sm text-slate-500">
            Keine Vorlagen gefunden
          </div>
        )}
      </div>
    </div>
  );
};

export default VorlagenPage;
