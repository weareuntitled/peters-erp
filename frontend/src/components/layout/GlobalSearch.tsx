import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface SearchResult {
  type: 'kunde' | 'dokument' | 'artikel' | 'warengruppe';
  id: number;
  label: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchProps {
  onClose: () => void;
}

const GlobalSearch = ({ onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get('/search', { params: { q } });
      if (res.data) {
        setResults(res.data);
      }
    } catch (e) {
      console.error('Search error:', e);
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

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    onClose();
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const typeLabels: Record<string, string> = {
      kunde: 'Kunden',
      dokument: 'Dokumente',
      artikel: 'Artikel',
      warengruppe: 'Warengruppen',
    };
    const label = typeLabels[r.type] || r.type;
    if (!acc[label]) acc[label] = [];
    acc[label].push(r);
    return acc;
  }, {});

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-96 rounded-md bg-white shadow-lg outline outline-1 outline-slate-100">
      <div className="p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kunden, Rechnungen, Artikel, Gruppen..."
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
          autoFocus
        />
      </div>

      {loading && (
        <div className="px-4 py-3 text-sm text-slate-500">Suche...</div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-500">Keine Ergebnisse</div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group}
              </div>
              {items.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-900">{item.label}</div>
                  {item.subtitle && (
                    <div className="text-xs text-slate-500">{item.subtitle}</div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
