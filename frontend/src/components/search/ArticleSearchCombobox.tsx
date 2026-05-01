import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../api/apiClient';

interface ArticleSearchComboboxProps {
  onSelect: (artikel: { id: number; label: string; artnr: string; warengruppe_id: number | null; warengruppe: string; einzelpreis: number }) => void;
}

const ArticleSearchCombobox = ({ onSelect }: ArticleSearchComboboxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      const res = await fetch(`${API_BASE_URL}/artikel/search?q=${encodeURIComponent(q)}&limit=7`);
      if (res.ok) setResults(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (item: any) => {
    onSelect(item);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Artikel suchen: Bezeichnung, Artnr, Warengruppe..."
        className="w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500"
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg outline outline-1 outline-slate-100">
          <div className="max-h-64 overflow-y-auto">
            {loading && <div className="px-4 py-3 text-sm text-slate-500">Suche...</div>}

            {!loading && query.length >= 1 && (
              <button
                onClick={() => handleSelect({
                  id: 0,
                  label: query,
                  artnr: 'FREI',
                  warengruppe_id: null,
                  warengruppe: 'Manuell',
                  einzelpreis: 0
                })}
                className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-3 text-left text-sm text-sky-600 hover:bg-sky-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>"{query}" als Freitext-Position hinzufügen</span>
              </button>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <div className="text-sm text-slate-500">Keine Artikel gefunden für "{query}"</div>
                <Link
                  to={`/stammdaten/artikel/new?bezeichnung=${encodeURIComponent(query)}`}
                  className="mt-2 inline-block rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                >
                  "{query}" als neuen Artikel anlegen
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
                  <div className="text-xs text-slate-500">{item.artnr} · {item.warengruppe} · {item.einzelpreis} €</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleSearchCombobox;
