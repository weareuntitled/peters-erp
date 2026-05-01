import { useSearchParams } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const [searchParams] = useSearchParams();

  const fromParam = searchParams.get('from');
  let fromItems: BreadcrumbItem[] = [];
  if (fromParam) {
    try {
      fromItems = JSON.parse(decodeURIComponent(fromParam));
    } catch {
      fromItems = [];
    }
  }

  const allItems = [...fromItems, ...items];

  const buildFromParam = (idx: number) => {
    const slice = allItems.slice(0, idx);
    return encodeURIComponent(JSON.stringify(slice));
  };

  return (
    <nav className="flex items-center gap-1 text-xs">
      {allItems.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRightIcon className="h-3 w-3 text-slate-400" />}
          {item.href ? (
            <a
              href={idx === allItems.length - 1 ? item.href : `${item.href}?from=${buildFromParam(idx)}`}
              className={`font-medium ${idx === allItems.length - 1 ? 'text-sky-950' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {item.label}
            </a>
          ) : (
            <span className={`font-medium ${idx === allItems.length - 1 ? 'text-sky-950' : 'text-slate-400'}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
