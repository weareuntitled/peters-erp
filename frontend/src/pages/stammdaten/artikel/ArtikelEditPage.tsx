import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

const ArtikelEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: artikel, isLoading } = useQuery({
    queryKey: ['artikel', id],
    queryFn: async () => {
      const res = await apiClient.get(`/artikel/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: warengruppen } = useQuery({
    queryKey: ['warengruppen'],
    queryFn: async () => {
      const res = await apiClient.get('/warengruppen');
      return res.data.items || res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/artikel/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artikel'] });
      navigate(`/stammdaten/artikel/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (value !== '') {
        if (['vk_preis', 'ek_preis', 'mwst_satz', 'gewicht', 'warengruppe_id'].includes(key)) {
          data[key] = parseFloat(value as string) || 0;
        } else if (key === 'aktiv') {
          data[key] = value === '1' ? 1 : 0;
        } else {
          data[key] = value;
        }
      }
    });
    if (formData.get('warengruppe_id') === '') {
      data.warengruppe_id = null;
    }
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6 text-slate-500">Laden...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/stammdaten/artikel/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Zurück
        </Link>
        <h1 className="font-heading text-2xl font-bold text-sky-950">
          Artikel bearbeiten
        </h1>
      </div>

      {/* Form */}
      <div className="rounded bg-white p-6 outline outline-1 outline-slate-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Artikelnummer *</label>
              <input
                name="artnr"
                defaultValue={artikel?.artnr}
                required
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Bezeichnung *</label>
              <input
                name="bezeichnung"
                defaultValue={artikel?.bezeichnung}
                required
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Kurztext</label>
            <input
              name="kurztext"
              defaultValue={artikel?.kurztext}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Beschreibung</label>
            <textarea
              name="langtext"
              defaultValue={artikel?.langtext}
              rows={4}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Warengruppe</label>
              <select
                name="warengruppe_id"
                defaultValue={artikel?.warengruppe_id || ''}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">Keine Warengruppe</option>
                {warengruppen?.map((wg: any) => (
                  <option key={wg.id} value={wg.id}>{wg.bezeichnung}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Einheit</label>
              <input
                name="einheit"
                defaultValue={artikel?.einheit || 'Stk'}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">VK-Preis</label>
              <input
                name="vk_preis"
                type="number"
                step="0.01"
                defaultValue={artikel?.vk_preis || 0}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">EK-Preis</label>
              <input
                name="ek_preis"
                type="number"
                step="0.01"
                defaultValue={artikel?.ek_preis || 0}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">MwSt-Satz %</label>
              <input
                name="mwst_satz"
                type="number"
                step="0.1"
                defaultValue={artikel?.mwst_satz || 19}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Gewicht (kg)</label>
              <input
                name="gewicht"
                type="number"
                step="0.01"
                defaultValue={artikel?.gewicht}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select
                name="aktiv"
                defaultValue={String(artikel?.aktiv !== undefined ? artikel.aktiv : 1)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="1">Aktiv</option>
                <option value="0">Inaktiv</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/stammdaten/artikel/${id}`)}
              className="rounded px-4 py-2 text-sm font-medium text-slate-600"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtikelEditPage;
