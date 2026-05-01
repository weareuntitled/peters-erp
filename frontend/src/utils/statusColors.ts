export const statusColor = (status: string, variant: 'dot' | 'badge' = 'dot'): string => {
  const s = (status || '').toLowerCase();
  if (variant === 'badge') {
    if (s === 'bezahlt') return 'bg-emerald-100 text-emerald-800';
    if (s === 'gebucht') return 'bg-sky-100 text-sky-800';
    if (s === 'offen') return 'bg-amber-100 text-amber-800';
    if (s.includes('überfällig') || s.includes('fällig')) return 'bg-red-100 text-red-800';
    if (s === 'storniert') return 'bg-red-50 text-red-700';
    return 'bg-zinc-100 text-zinc-800';
  }

  if (s === 'bezahlt') return 'bg-emerald-600';
  if (s === 'gebucht') return 'bg-sky-600';
  if (s === 'offen') return 'bg-amber-500';
  if (s.includes('überfällig') || s.includes('fällig')) return 'bg-red-600';
  if (s === 'storniert') return 'bg-red-500';
  return 'bg-zinc-400';
};
