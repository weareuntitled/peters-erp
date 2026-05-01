import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/layout/AppSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('gswin_sidebar_collapsed');
    return stored === 'true';
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => {
          setSidebarCollapsed(!sidebarCollapsed);
          localStorage.setItem('gswin_sidebar_collapsed', String(!sidebarCollapsed));
        }}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <DashboardHeader />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="px-6 py-6">
            <div className="mx-auto max-w-[1600px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
