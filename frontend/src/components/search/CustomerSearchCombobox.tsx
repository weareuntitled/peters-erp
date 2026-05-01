import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../api/apiClient';

interface CustomerSearchComboboxProps {
  onSelect: (kunde: { id: number; label: string; kundnr: string; ort: string }) => void;
  selectedKunde?: { id: number; label: string; kundnr: string; ort: string } | null;
  onClear: () => void;
}

const CustomerSearchCombobox = ({ onSelect, selectedKunde, onClear }: CustomerSearchComboboxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/kunden/recent?limit=7`)
      .then((r) => r.json())
      .then(setRecent)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/kunden/search?q=${encodeURIComponent(q)}&limit=7`);
      if (res.ok) setResults(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && !selectedKunde) search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search, selectedKunde]);

  const handleSelect = (item: any) => {
    onSelect({ id: item.id, label: item.label, kundnr: item.kundnr, ort: item.ort });
    setQuery('');
    setIsOpen(false);
  };

  if (selectedKunde) {
    return (
      <div className="flex items-center justify-between rounded bg-slate-50 p-4 outline outline-1 outline-neutral-300">
        <div>
          <div className="font-heading text-lg font-semibold text-zinc-900">{selectedKunde.label}</div>
          <div className="text-sm text-zinc-700">{selectedKunde.kundnr} · {selectedKunde.ort}</div>
        </div>
        <button
          onClick={onClear}
          className="rounded-sm px-4 py-2 text-xs font-semibold text-zinc-900 outline outline-1 outline-neutral-300"
        >
          Ändern
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Kunde suchen: Name, Kundennummer, Kontaktperson, Ort..."
        className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500"
      />

      {isOpen && !selectedKunde && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg outline outline-1 outline-slate-100">
          <div className="max-h-64 overflow-y-auto">
            {query.length < 2 && recent.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Zuletzt verwendet
                </div>
                {recent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.kundnr} · {item.ort}</div>
                  </button>
                ))}
              </>
            )}

            {loading && <div className="px-4 py-3 text-sm text-slate-500">Suche...</div>}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <div className="text-sm text-slate-500">Keine Kunden gefunden für "{query}"</div>
                <Link
                  to={`/stammdaten/kunden/new?name=${encodeURIComponent(query)}`}
                  className="mt-2 inline-block rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                >
                  "{query}" als neuen Kunden anlegen
                </Link>
              </div>
            )}

            {!loading && results.length > 0 && (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.kundnr} · {item.ort}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchCombobox;
