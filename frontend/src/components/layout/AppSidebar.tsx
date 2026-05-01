import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { authAtom } from '../../stores/authStore';
import {
  HomeIcon,
  DocumentIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Angebote', href: '/angebote', icon: DocumentIcon },
  { name: 'Rechnungen', href: '/rechnungen', icon: CreditCardIcon },
  { name: 'Storno', href: '/storno', icon: XCircleIcon },
];

const navGroups: NavGroup[] = [
  {
    name: 'Stammdaten',
    icon: ArchiveBoxIcon,
    children: [
      { name: 'Kunden', href: '/stammdaten/kunden' },
      { name: 'Artikel', href: '/stammdaten/artikel' },
      { name: 'Warengruppen', href: '/stammdaten/warengruppen' },
    ],
  },
];

const settingsItem: NavItem = {
  name: 'Einstellungen',
  href: '/einstellungen',
  icon: Cog6ToothIcon,
};

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const [auth, setAuth] = useAtom(authAtom);
  const [stammdatenOpen, setStammdatenOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGroupActive = (children: { href: string }[]) => {
    return children.some((child) => isActive(child.href));
  };

  const handleLogout = () => {
    setAuth({ user: null, accessToken: null, isLoading: false, error: null });
    navigate('/login');
  };

  const toggleStammdaten = () => {
    setStammdatenOpen(!stammdatenOpen);
  };

  return (
    <div className={`relative flex h-screen flex-col bg-sky-900 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Sidebar header */}
      <div className="pb-8 pt-6">
        <div className={collapsed ? 'px-3' : 'px-6'}>
          <div className={`font-heading text-xl font-extrabold text-white ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && 'Peters GmbH'}
            {collapsed && 'P'}
          </div>
          {!collapsed && (
            <div className="text-base font-normal leading-6 text-white/70">
              Spenglerei ERP
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto">
        <nav className={`flex flex-col gap-1 ${collapsed ? 'px-1' : 'px-4'}`}>
          {/* Main nav items */}
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-r border-l-4 px-4 py-3 text-sm leading-5 transition-colors ${
                  active
                    ? 'bg-white/10 border-sky-400 font-semibold text-white'
                    : 'border-transparent font-normal text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Expandable groups */}
          {navGroups.map((group) => {
            const groupActive = isGroupActive(group.children);
            const Icon = group.icon;
            return (
              <div key={group.name}>
                <button
                  onClick={toggleStammdaten}
                  className={`flex w-full items-center justify-between rounded-r border-l-4 px-4 py-3 text-sm leading-5 transition-colors ${
                    groupActive
                      ? 'bg-white/10 border-sky-400 font-semibold text-white'
                      : 'border-transparent font-normal text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  title={collapsed ? group.name : undefined}
                >
                  <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{group.name}</span>}
                  </div>
                  {!collapsed && (
                    stammdatenOpen ? (
                      <ChevronDownIcon className="h-3 w-3 text-slate-300" />
                    ) : (
                      <ChevronRightIcon className="h-3 w-3 text-slate-300" />
                    )
                  )}
                </button>

                {/* Children */}
                {stammdatenOpen && !collapsed && (
                  <div className="mt-1 flex flex-col">
                    {group.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`rounded-r px-7 py-3 text-sm leading-5 transition-colors ${
                            childActive
                              ? 'font-semibold text-white bg-white/5'
                              : 'font-normal text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Settings */}
          <Link
            to={settingsItem.href}
            className={`flex items-center gap-3 rounded-r border-l-4 px-4 py-3 text-sm leading-5 transition-colors ${
              isActive(settingsItem.href)
                ? 'bg-white/10 border-sky-400 font-semibold text-white'
                : 'border-transparent font-normal text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
            title={collapsed ? settingsItem.name : undefined}
          >
            <settingsItem.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{settingsItem.name}</span>}
          </Link>
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-normal leading-5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle - absolute at sidebar right edge, vertically centered */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-sky-700 bg-sky-800 text-slate-300 shadow-sm transition-all hover:bg-sky-700 hover:text-white ${
          collapsed ? 'right-0' : '-right-3.5'
        }`}
        title={collapsed ? 'Sidebar öffnen' : 'Sidebar schließen'}
      >
        {collapsed ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default AppSidebar;
