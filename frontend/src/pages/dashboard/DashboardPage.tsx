import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, BanknotesIcon, CreditCardIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';
import { formatCurrency } from '../../hooks/useTranslation';
import { statusColor } from '../../utils/statusColors';

interface DashboardAggregate {
  umsatz: number;
  offene_count: number;
  days: number;
  aktivitaet: { datum: string; umsatz: number }[];
    recent: {
      id: number;
      dokument_nr: string;
      typ: string;
      status: string;
      datum: string;
      betrag_brutto: number;
      kunde_id: number;
      kunde_name?: string;
    }[];
    warengruppen: {
      id: number;
      name: string;
      umsatz: number;
    }[];
    available_years?: number;
  }

type TimeFilter = { type: 'days'; value: number } | { type: 'year'; value: number } | { type: 'all' };

const DashboardPage = () => {
  const [docType, setDocType] = useState<'AN' | 'RE'>('RE');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({ type: 'days', value: 30 });
  const navigate = useNavigate();

  const { data: einstellungen } = useQuery({
    queryKey: ['firmen-einstellungen'],
    queryFn: async () => {
      const res = await apiClient.get('/firmen-einstellungen');
      return res.data;
    },
  });

  const revenueGoal = einstellungen?.umsatzziel_monat || 50000;

  const apiParams = useMemo(() => {
    if (timeFilter.type === 'days') return { typ: docType, days: timeFilter.value };
    if (timeFilter.type === 'year') return { typ: docType, year: timeFilter.value };
    return { typ: docType, all_years: true };
  }, [docType, timeFilter]);

  const { data, isLoading } = useQuery<DashboardAggregate>({
    queryKey: ['dashboard-aggregate', docType, timeFilter],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/aggregate', { params: apiParams });
      return res.data;
    },
  });

  const availableYears = useMemo(() => {
    const years = data?.available_years || [];
    const currentYear = new Date().getFullYear();
    const lastThree = [currentYear, currentYear - 1, currentYear - 2];
    const combined = new Set([...lastThree, ...years]);
    return Array.from(combined).sort((a, b) => b - a);
  }, [data?.available_years]);

  const timeFilterLabel = useMemo(() => {
    if (timeFilter.type === 'days') return `Letzte ${timeFilter.value} Tage`;
    if (timeFilter.type === 'year') return String(timeFilter.value);
    return 'Alle Jahre';
  }, [timeFilter]);

  const maxRevenueInChart = Math.max(...(data?.aktivitaet.map(a => a.umsatz) || [1]), revenueGoal / 30);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded bg-white p-5 outline outline-1 outline-slate-200 shadow-sm">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(((data?.umsatz || 0) / revenueGoal) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Title + Shortcut buttons */}
      <div className="flex items-end justify-between">
        <h1 className="font-heading text-base font-semibold text-sky-950">
          Dashboard
        </h1>
        <div className="flex gap-3">
          <Link
            to="/angebote/new"
            className="flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline outline-1 outline-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Angebot
          </Link>
          <Link
            to="/rechnungen/new"
            className="flex items-center gap-2 rounded bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600 transition-all shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Rechnung
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Umsatz Card with Progress */}
        <div className="flex flex-col gap-4 rounded-xl bg-white p-5 outline outline-1 outline-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Umsatz ({timeFilterLabel})
            </span>
            <BanknotesIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="flex flex-col">
            <div className="font-heading text-2xl font-bold text-slate-900">
              {formatCurrency(data?.umsatz || 0)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Ziel: {formatCurrency(revenueGoal)}
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Offene Dokumente */}
        <div className="flex flex-col gap-4 rounded-xl bg-white p-5 outline outline-1 outline-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Offene {docType === 'RE' ? 'Rechnungen' : 'Angebote'}
            </span>
            <CreditCardIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="font-heading text-2xl font-bold text-slate-900">
            {data?.offene_count || 0}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
            Aktion erforderlich
          </div>
        </div>

        {/* Aktivitt (Revenue Trend) */}
        <div className="flex flex-col gap-4 rounded-xl bg-white p-5 outline outline-1 outline-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Trend
            </span>
            <ArrowTrendingUpIcon className="h-4 w-4 text-sky-600" />
          </div>
          <div className="flex-1 flex items-end gap-1 min-h-[40px]">
            {data?.aktivitaet && data.aktivitaet.length > 0 ? (
              data.aktivitaet.slice(-30).map((a, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t-sm bg-sky-700 transition-all hover:bg-sky-500"
                  style={{ height: `${Math.max((a.umsatz / maxRevenueInChart) * 100, 4)}%` }}
                  title={`${a.datum}: ${formatCurrency(a.umsatz)}`}
                />
              ))
            ) : (
              <div className="text-xs text-slate-400">Keine Daten</div>
            )}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
            Eingänge {timeFilterLabel.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Doc Type Toggle + Time Filter */}
      <div className="flex items-end justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setDocType('AN')}
            className={`rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              docType === 'AN'
                ? 'bg-sky-950 text-white'
                : 'bg-white text-slate-500 outline outline-1 outline-slate-200 hover:bg-slate-50'
            }`}
          >
            Angebote
          </button>
          <button
            onClick={() => setDocType('RE')}
            className={`rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
              docType === 'RE'
                ? 'bg-sky-950 text-white'
                : 'bg-white text-slate-500 outline outline-1 outline-slate-200 hover:bg-slate-50'
            }`}
          >
            Rechnungen
          </button>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents Table */}
        <div className="lg:col-span-2 rounded-xl bg-white outline outline-1 outline-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-900">
              Kürzlich bearbeitete {docType === 'RE' ? 'Rechnungen' : 'Angebote'}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="w-16 px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Nummer</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Kunde</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Datum</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Brutto</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-50 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => {
                      const path = doc.typ === 'RE' ? `/rechnungen/${doc.id}` : `/angebote/${doc.id}`;
                      navigate(path);
                    }}
                  >
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${statusColor(doc.status)}`} />
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{doc.dokument_nr}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-[120px] truncate">{doc.kunde_name || `Kunde #${doc.kunde_id}`}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold whitespace-nowrap">{doc.datum || '—'}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-900">{formatCurrency(doc.betrag_brutto)}</td>
                  </tr>
                ))}
                {(!data?.recent || data.recent.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      Keine {docType === 'RE' ? 'Rechnungen' : 'Angebote'} gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warengruppen Breakdown */}
        <div className="rounded-xl bg-white outline outline-1 outline-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-900">
              Warengruppen {timeFilterLabel}
            </h2>
          </div>
          <div className="p-5 flex flex-col gap-5">
            {data?.warengruppen && data.warengruppen.length > 0 ? (
              data.warengruppen.slice(0, 8).map((wg) => {
                const percent = (wg.umsatz / (data?.umsatz || 1)) * 100;
                return (
                  <div key={wg.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700 truncate pr-2">{wg.name}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(wg.umsatz)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-900 rounded-full opacity-80"
                        style={{ width: `${Math.max(percent, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                Keine Daten für diesen Zeitraum
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
