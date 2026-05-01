import { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

const KundenEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const initialName = searchParams.get('name') || '';

  const { data: kunde, isLoading } = useQuery({
    queryKey: ['kunde', id],
    queryFn: async () => {
      const res = await apiClient.get(`/kunden/${id}`);
      return res.data;
    },
    enabled: !isNew && !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/kunden', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      navigate('/stammdaten/kunden');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/kunden/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kunden'] });
      navigate(`/stammdaten/kunden/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (value !== '') data[key] = value;
    });
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  if (!isNew && isLoading) {
    return <div className="p-6 text-slate-500">Laden...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={isNew ? '/stammdaten/kunden' : `/stammdaten/kunden/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Zurück
        </Link>
        <h1 className="font-heading text-2xl font-bold text-sky-950">
          {isNew ? 'Neuer Kunde' : 'Kunde bearbeiten'}
        </h1>
      </div>

      {/* Form */}
      <div className="rounded bg-white p-6 outline outline-1 outline-slate-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Kundennummer</label>
              <input
                name="kundnr"
                defaultValue={kunde?.kundnr}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Anrede</label>
              <select
                name="anrede"
                defaultValue={kunde?.anrede || ''}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="">Bitte wählen</option>
                <option value="Herr">Herr</option>
                <option value="Frau">Frau</option>
                <option value="Firma">Firma</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Vorname</label>
              <input
                name="vorname"
                defaultValue={kunde?.vorname}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nachname *</label>
              <input
                name="name"
                defaultValue={kunde?.name || initialName}
                required
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Zusatz</label>
            <input
              name="zusatz"
              defaultValue={kunde?.zusatz}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Straße</label>
              <input
                name="strasse"
                defaultValue={kunde?.strasse}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">PLZ</label>
                <input
                  name="plz"
                  defaultValue={kunde?.plz}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ort</label>
                <input
                  name="ort"
                  defaultValue={kunde?.ort}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Telefon</label>
              <input
                name="telefon"
                type="tel"
                defaultValue={kunde?.telefon}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Mobil</label>
              <input
                name="mobil"
                type="tel"
                defaultValue={kunde?.mobil}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">E-Mail</label>
              <input
                name="email"
                type="email"
                defaultValue={kunde?.email}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Website</label>
              <input
                name="homepage"
                type="url"
                defaultValue={kunde?.homepage}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">IBAN</label>
              <input
                name="iban"
                defaultValue={kunde?.iban}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">BIC</label>
              <input
                name="bic"
                defaultValue={kunde?.bic}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Bank</label>
              <input
                name="bank"
                defaultValue={kunde?.bank}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Notiz</label>
            <textarea
              name="notiz"
              defaultValue={kunde?.notiz}
              rows={4}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(isNew ? '/stammdaten/kunden' : `/stammdaten/kunden/${id}`)}
              className="rounded px-4 py-2 text-sm font-medium text-slate-600"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KundenEditPage;
