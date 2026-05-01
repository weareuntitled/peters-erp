import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

const ArtikelNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialBezeichnung = searchParams.get('bezeichnung') || '';

  const { data: warengruppen } = useQuery({
    queryKey: ['warengruppen'],
    queryFn: async () => {
      const res = await apiClient.get('/warengruppen');
      return res.data.items || res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/artikel', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['artikel'] });
      navigate(`/stammdaten/artikel/${res.data.id}`);
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
    data.aktiv = 1;
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/stammdaten/artikel" className="text-sm text-slate-500 hover:text-slate-700">
          ← Zurück
        </Link>
        <h1 className="font-heading text-2xl font-bold text-sky-950">
          Neuer Artikel
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
                required
                placeholder="z.B. ART-001"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Bezeichnung *</label>
              <input
                name="bezeichnung"
                defaultValue={initialBezeichnung}
                required
                placeholder="z.B. Spanndecke 50mm"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Kurztext</label>
            <input
              name="kurztext"
              placeholder="Kurze Beschreibung"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Beschreibung</label>
            <textarea
              name="langtext"
              rows={4}
              placeholder="Ausführliche Beschreibung..."
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Warengruppe</label>
              <select
                name="warengruppe_id"
                defaultValue=""
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
                defaultValue="Stk"
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
                defaultValue={0}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">EK-Preis</label>
              <input
                name="ek_preis"
                type="number"
                step="0.01"
                defaultValue={0}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">MwSt-Satz %</label>
              <input
                name="mwst_satz"
                type="number"
                step="0.1"
                defaultValue={19}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Gewicht (kg)</label>
            <input
              name="gewicht"
              type="number"
              step="0.01"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/stammdaten/artikel')}
              className="rounded px-4 py-2 text-sm font-medium text-slate-600"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtikelNewPage;
