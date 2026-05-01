import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../api/apiClient';

interface Warengruppe {
  id: number;
  bezeichnung: string;
}

interface Artikel {
  id: number;
  bezeichnung: string;
  artnr: string;
  vk_preis: number;
  einheit: string;
  warengruppe_id: number | null;
  warengruppe: string;
}

interface WarengruppeArticleSelectorProps {
  onSelect: (artikel: { id: number; label: string; artnr: string; warengruppe_id: number | null; warengruppe: string; einzelpreis: number; einheit: string }) => void;
  onClose: () => void;
}

const WarengruppeArticleSelector = ({ onSelect, onClose }: WarengruppeArticleSelectorProps) => {
  const [warengruppen, setWarengruppen] = useState<Warengruppe[]>([]);
  const [selectedWg, setSelectedWg] = useState<Warengruppe | null>(null);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/warengruppen`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.items) {
          setWarengruppen(data.items);
        } else if (Array.isArray(data)) {
          setWarengruppen(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWg) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/artikel/?warengruppe_id=${selectedWg.id}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || data || [];
        setArtikel(items.map((a: any) => ({
          id: a.id,
          bezeichnung: a.bezeichnung,
          artnr: a.artnr,
          vk_preis: a.vk_preis || 0,
          einheit: a.einheit || 'Stk',
          warengruppe_id: selectedWg.id,
          warengruppe: selectedWg.bezeichnung,
        })));
      })
      .catch(() => setArtikel([]))
      .finally(() => setLoading(false));
  }, [selectedWg]);

  const filteredArtikel = searchQuery
    ? artikel.filter(a =>
        a.bezeichnung.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.artnr.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artikel;

  const handleSelectArtikel = (a: Artikel) => {
    onSelect({
      id: a.id,
      label: a.bezeichnung,
      artnr: a.artnr,
      warengruppe_id: a.warengruppe_id,
      warengruppe: a.warengruppe,
      einzelpreis: a.vk_preis,
      einheit: a.einheit,
    });
  };

  if (!selectedWg) {
    return (
      <div ref={ref} className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Warengruppe wählen</h4>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Schließen</button>
        </div>
        {warengruppen.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-500">Keine Warengruppen vorhanden.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {warengruppen.map((wg) => (
              <button
                key={wg.id}
                onClick={() => setSelectedWg(wg)}
                className="rounded border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition-all"
              >
                {wg.bezeichnung}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWg(null)}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← Zurück
          </button>
          <h4 className="text-sm font-semibold text-slate-700">{selectedWg.bezeichnung}</h4>
        </div>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Schließen</button>
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="In dieser Gruppe suchen..."
        className="mb-3 w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
      />

      {loading ? (
        <div className="py-4 text-center text-sm text-slate-500">Lade Artikel...</div>
      ) : filteredArtikel.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-500">Keine Artikel in dieser Gruppe.</div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {filteredArtikel.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectArtikel(a)}
              className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left hover:bg-white transition-colors last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-slate-900">{a.bezeichnung}</div>
                <div className="text-xs text-slate-500">{a.artnr} · {a.einheit}</div>
              </div>
              <div className="text-sm font-semibold text-sky-600">
                {a.vk_preis.toFixed(2)} €
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarengruppeArticleSelector;
