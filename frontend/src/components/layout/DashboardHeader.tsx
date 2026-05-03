import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAtom } from 'jotai';
import { useNavigate, Link } from 'react-router-dom';
import { authAtom } from '../../stores/authStore';
import apiClient from '../../api/apiClient';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SearchResult {
  type: 'kunde' | 'dokument' | 'artikel' | 'warengruppe';
  id: number;
  label: string;
  subtitle?: string;
  href: string;
}

const DashboardHeader = ({ onToggleSidebar }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [auth, setAuth] = useAtom(authAtom);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Search state
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const { data: settings } = useQuery<{ logo_pfad?: string }>({
    queryKey: ['firmen-einstellungen'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/firmen-einstellungen/');
        return res.data;
      } catch {
        return {};
      }
    },
  });

  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
  const logoUrl = settings?.logo_pfad ? `${BACKEND_URL}${settings.logo_pfad}` : null;

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await apiClient.get('/search', { params: { q } });
      if (res.data) {
        setSearchResults(res.data);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ user: null, accessToken: null, isLoading: false, error: null });
    navigate('/login');
  };
  
  const handleSelectSearch = (result: SearchResult) => {
    navigate(result.href);
    setSearchFocused(false);
    setSearchQuery('');
  };

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      
      {/* Left side: Global Search inline */}
      <div ref={searchRef} className="relative w-96">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Kunden, Rechnungen, Artikel, Gruppen suchen..."
          className="w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 transition-all"
        />
        
        {/* Search Results Dropdown */}
        {searchFocused && searchQuery.length >= 2 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md bg-white shadow-lg outline outline-1 outline-slate-100 max-h-96 overflow-y-auto">
            {searchLoading && (
              <div className="px-4 py-3 text-sm text-slate-500">Suchen...</div>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">Keine Ergebnisse für "{searchQuery}"</div>
            )}
            {!searchLoading && Object.keys(groupedResults).length > 0 && (
              <div className="py-2">
                {Object.entries(groupedResults).map(([group, items]) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {group}
                    </div>
                    {items.map((item, idx) => (
                      <button
                        key={`${item.type}-${item.id}-${idx}`}
                        onClick={() => handleSelectSearch(item)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex flex-col"
                      >
                        <span className="font-semibold text-slate-900">{item.label}</span>
                        {item.subtitle && (
                          <span className="text-xs text-slate-500">{item.subtitle}</span>
                        )}
                  </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center text-slate-500 hover:text-slate-700"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-4 py-2">
                <span className="text-sm font-semibold text-slate-900">Benachrichtigungen</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${!notif.is_read ? 'bg-sky-50' : ''}`}
                    >
                      <div className="text-sm font-medium text-slate-900">{notif.title}</div>
                      <div className="text-xs text-slate-500">{notif.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    Keine Benachrichtigungen
                  </div>
                )}
              </div>
              {notifications && notifications.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-2">
                  <Link to="/notifications" className="text-xs text-sky-600 hover:text-sky-800" onClick={() => setNotifOpen(false)}>
                    Alle anzeigen
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

         {/* User Profile */}
         <div ref={profileRef} className="relative">
           <button
             onClick={() => setProfileOpen(!profileOpen)}
             className="flex items-center gap-2 rounded-full hover:bg-slate-50"
           >
             {logoUrl ? (
               <img
                 src={logoUrl}
                 alt="Firmenlogo"
                 className="h-8 w-8 rounded-full object-contain border border-slate-300 bg-white"
                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
               />
             ) : (
               <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 font-medium text-xs text-slate-700">
                 {getInitials(auth.user?.full_name)}
               </div>
             )}
           </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">{auth.user?.full_name || 'User'}</div>
                <div className="text-xs text-slate-500">{auth.user?.email || ''}</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/einstellungen'); setProfileOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Einstellungen
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-slate-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
