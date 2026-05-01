import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    },
  });

  const markAsRead = (id: number) => {
    // We store read IDs in localStorage since notifications are dynamically generated
    const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mt-4">
        <h1 className="font-heading text-base font-semibold text-sky-950">
          Benachrichtigungen
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-bold text-sky-500">({unreadCount} neu)</span>
          )}
        </h1>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center outline outline-1 outline-slate-200">
          <p className="text-sm text-slate-500">Keine Benachrichtigungen vorhanden.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl bg-white p-5 outline outline-1 outline-slate-200 transition-all ${
                notif.is_read ? 'opacity-60' : 'bg-sky-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{notif.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{notif.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{notif.created_at}</p>
                </div>
                <button
                  onClick={() => markAsRead(notif.id)}
                  className={`flex-shrink-0 flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    notif.is_read
                      ? 'text-slate-400 hover:text-slate-600'
                      : 'text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100'
                  }`}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  {notif.is_read ? 'Gelesen' : 'Als gelesen markieren'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
