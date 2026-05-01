import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 ${className}`}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUpIcon
          className={`-mb-1 h-3 w-3 ${isActive && currentDir === 'asc' ? 'text-sky-600' : 'text-slate-300'}`}
        />
        <ChevronDownIcon
          className={`-mt-1 h-3 w-3 ${isActive && currentDir === 'desc' ? 'text-sky-600' : 'text-slate-300'}`}
        />
      </span>
    </button>
  );
}
