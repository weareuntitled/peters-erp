import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  StarIcon, 
  InboxIcon,
  ChevronRightIcon,
  ViewColumnsIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../api/apiClient';
import { formatCurrency } from '../../../hooks/useTranslation';

interface WarengruppeItem {
  id: number;
  bezeichnung: string;
  revenue: number;
  margin: number;
  growth: number;
  last_used: string | null;
}

interface WarengruppenAnalysis {
  items: WarengruppeItem[];
  total_revenue: number;
  avg_margin: number;
  top_group: string;
  active_articles: number;
  available_years?: number[];
}

type TimeFilter = { type: 'days'; value: number } | { type: 'year'; value: number } | { type: 'all' };

const chartBgColors = [
  '#0c4a6e', // sky-900
  '#075985', // sky-800
  '#0369a1', // sky-700
  '#0284c7', // sky-600
  '#0ea5e9', // sky-500
  '#38bdf8', // sky-400
  '#7dd3fc', // sky-300
  '#bae6fd', // sky-200
];

const WarengruppenPage = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'all' });
  const [search, setSearch] = useState('');

  const apiParams = useMemo(() => {
    if (timeFilter.type === 'days') return { days: timeFilter.value };
    if (timeFilter.type === 'year') return { year: timeFilter.value };
    return { all_years: true };
  }, [timeFilter]);

  const { data: analysis, isLoading } = useQuery<WarengruppenAnalysis>({
    queryKey: ['warengruppen-analysis', timeFilter],
    queryFn: async () => {
      const res = await apiClient.get('/warengruppen/analysis', { params: apiParams });
      return res.data;
    },
  });

  const availableYears = useMemo(() => {
    const years = analysis?.available_years || [];
    const currentYear = new Date().getFullYear();
    const lastThree = [currentYear, currentYear - 1, currentYear - 2];
    const combined = new Set([...lastThree, ...years]);
    return Array.from(combined).sort((a, b) => b - a);
  }, [analysis?.available_years]);

  const timeFilterLabel = useMemo(() => {
    if (timeFilter.type === 'days') return `Letzte ${timeFilter.value} Tage`;
    if (timeFilter.type === 'year') return String(timeFilter.value);
    return 'Alle Jahre';
  }, [timeFilter]);

  if (isLoading) {
    return <div className="p-6 text-slate-500 font-body-md">Laden der Umsatzanalyse...</div>;
  }

  const items = analysis?.items || [];
  const maxRevenue = Math.max(...items.map((i) => i.revenue), 1);
  const filteredItems = search
    ? items.filter((i) => i.bezeichnung.toLowerCase().includes(search.toLowerCase()))
    : items;

  const totalRevenue = analysis?.total_revenue || 1;
  
  // Calculate relative percentages for CSS pie chart
  const topItems = items.slice(0, 5);
  const p1 = Math.round((topItems[0]?.revenue / totalRevenue) * 100) || 0;
  const p2 = Math.round(((topItems[0]?.revenue + topItems[1]?.revenue) / totalRevenue) * 100) || 0;
  const p3 = Math.round((topItems.slice(0, 3).reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100) || 0;
  const p4 = Math.round((topItems.slice(0, 4).reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100) || 0;
  
  const pieGradient = `conic-gradient(
    ${chartBgColors[0]} 0% ${p1}%,
    ${chartBgColors[1]} ${p1}% ${p2}%,
    ${chartBgColors[2]} ${p2}% ${p3}%,
    ${chartBgColors[3]} ${p3}% ${p4}%,
    ${chartBgColors[4]} ${p4}% 100%
  )`;

  return (
    <div className="flex flex-col gap-gutter">
      {/* Header + Time Filter */}
      <div className="flex items-end justify-between mt-4">
        <h1 className="font-heading text-base font-semibold text-sky-950">
          Warengruppen-Analyse ({timeFilterLabel})
        </h1>
        <select
          value={timeFilter.type === 'days' ? `days-${timeFilter.value}` : timeFilter.type === 'year' ? `year-${timeFilter.value}` : 'all'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'all') setTimeFilter({ type: 'all' });
            else if (val.startsWith('days-')) setTimeFilter({ type: 'days', value: Number(val.split('-')[1]) });
            else if (val.startsWith('year-')) setTimeFilter({ type: 'year', value: Number(val.split('-')[1]) });
          }}
          className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="days-30">Letzte 30 Tage</option>
          <option value="days-90">Letzte 90 Tage</option>
          {availableYears.map(year => (
            <option key={year} value={`year-${year}`}>{year}</option>
          ))}
          <option value="all">Alle Jahre</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-md">Gesamtumsatz</span>
            <BanknotesIcon className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-headline-lg">{formatCurrency(analysis?.total_revenue || 0)}</div>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold font-label-md">
            <span className="text-emerald-600 flex items-center">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" /> +12.4%
            </span>
            <span className="text-slate-400">vs. Vorjahr</span>
          </div>
        </div>
        
        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-md">Durchschn. Marge</span>
            <ArrowTrendingUpIcon className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-headline-lg">{analysis?.avg_margin || 0}%</div>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold font-label-md">
            <span className="text-emerald-600 flex items-center">
              <ArrowTrendingUpIcon className="h-3 w-3 mr-0.5" /> +1.2%
            </span>
            <span className="text-slate-400">vs. Vorjahr</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-md">Stärkste Gruppe</span>
            <StarIcon className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-headline-md mt-1 truncate">{analysis?.top_group || 'N/A'}</div>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold font-label-md text-slate-400">
            Anteil am Gesamtumsatz
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-md">Aktive Artikel</span>
            <InboxIcon className="h-5 w-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-headline-lg">{analysis?.active_articles || 0}</div>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold font-label-md text-slate-400">
            Im Sortiment
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-slate-900">Details nach Warengruppe</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input 
                className="pl-8 pr-3 py-1.5 bg-slate-50 text-slate-900 text-xs border border-slate-200 rounded focus:border-sky-500 outline-none transition-all w-48 font-medium" 
                placeholder="Suchen..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="p-1.5 text-slate-400 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-md">
              <tr>
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-6 w-40">WARENGRUPPE</th>
                <th className="py-3 px-4 w-36 text-right">UMSATZ</th>
                <th className="py-3 px-4 w-20 text-right">MARGE</th>
                <th className="py-3 px-4 w-24 text-right">WACHSTUM</th>
                <th className="py-3 px-4 w-24 text-right">LETZTE VERW.</th>
                <th className="py-3 px-4 w-12 text-center">AKTION</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 font-data-tabular">
              {filteredItems.map((item, idx) => (
                <tr 
                  key={item.id} 
                  className="border-b border-surface-1 hover:bg-surface-2/50 transition-colors h-10 cursor-pointer"
                  onClick={() => navigate('/stammdaten/artikel?warengruppe_id=' + item.id)}
                >
                  <td className="py-2 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-2 px-6 font-bold text-slate-900">{item.bezeichnung}</td>
                  <td className="py-2 px-4 text-right font-semibold tabular-nums">{formatCurrency(item.revenue)}</td>
                  <td className="py-2 px-4 text-right font-medium tabular-nums">{item.margin}%</td>
                  <td className="py-2 px-4 text-right font-bold tabular-nums">{item.growth > 0 ? '+' : ''}{item.growth}%</td>
                  <td className="py-2 px-4 text-right font-medium tabular-nums text-slate-500">{item.last_used || 'N/A'}</td>
                  <td className="py-2 px-6 text-center">
                    <button className="text-slate-300 hover:text-sky-600 transition-colors">
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Keine Warengruppen gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination / Table Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 font-label-md">
          <div>Zeige 1 bis {filteredItems.length} von {items.length} Gruppen</div>
          <div className="flex gap-1">
            <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled>
              <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarengruppenPage;
