import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';

// Layout components
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Page components
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth components and state
import { authAtom } from './stores/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Customer routes
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import NewCustomerPage from './pages/customers/NewCustomerPage';

// Stammdaten routes
import KundenPage from './pages/stammdaten/kunden/KundenPage';
import KundenDetailPage from './pages/stammdaten/kunden/KundenDetailPage';
import KundenEditPage from './pages/stammdaten/kunden/KundenEditPage';
import ArtikelPage from './pages/stammdaten/artikel/ArtikelPage';
import ArtikelDetailPage from './pages/stammdaten/artikel/ArtikelDetailPage';
import ArtikelEditPage from './pages/stammdaten/artikel/ArtikelEditPage';
import ArtikelNewPage from './pages/stammdaten/artikel/ArtikelNewPage';
import WarengruppenPage from './pages/stammdaten/warengruppen/WarengruppenPage';
import WarengruppeArtikelPage from './pages/stammdaten/warengruppen/WarengruppeArtikelPage';
import VorlagenPage from './pages/stammdaten/vorlagen/VorlagenPage';

// Document routes
import AngebotePage from './pages/documents/AngebotePage';
import RechnungenPage from './pages/documents/RechnungenPage';
import RechnungDetailPage from './pages/documents/RechnungDetailPage';
import AngebotDetailPage from './pages/documents/AngebotDetailPage';
import DocumentDetailPage from './pages/documents/DocumentDetailPage';
import QuoteCreationPage from './pages/documents/QuoteCreationPage';
import NotificationsPage from './pages/documents/NotificationsPage';
import StornoPage from './pages/documents/StornoPage';

// Settings
import EinstellungenPage from './pages/settings/EinstellungenPage';

// Legacy routes (kept for backward compatibility)
import SuppliersPage from './pages/suppliers/SuppliersPage';
import ProductsPage from './pages/products/ProductsPage';
import OrdersPage from './pages/orders/OrdersPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage';
import TemplatesPage from './pages/templates/TemplatesPage';
import TemplateEditorPage from './pages/templates/TemplateEditorPage';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuth(prev => ({ ...prev, user }));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setInitialized(true);
  }, [setAuth]);

  if (!initialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          auth.user ? <Navigate to="/dashboard" state={{ from: location }} replace /> : <LoginPage />
        } />
      </Route>

      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Dashboard */}
        <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />

        {/* New Stammdaten routes */}
        <Route path="/stammdaten/kunden" element={<ErrorBoundary><KundenPage /></ErrorBoundary>} />
        <Route path="/stammdaten/kunden/new" element={<ErrorBoundary><KundenEditPage /></ErrorBoundary>} />
        <Route path="/stammdaten/kunden/:id" element={<ErrorBoundary><KundenDetailPage /></ErrorBoundary>} />
        <Route path="/stammdaten/kunden/:id/edit" element={<ErrorBoundary><KundenEditPage /></ErrorBoundary>} />
        <Route path="/stammdaten/artikel" element={<ErrorBoundary><ArtikelPage /></ErrorBoundary>} />
        <Route path="/stammdaten/artikel/new" element={<ErrorBoundary><ArtikelNewPage /></ErrorBoundary>} />
        <Route path="/stammdaten/artikel/:id" element={<ErrorBoundary><ArtikelDetailPage /></ErrorBoundary>} />
        <Route path="/stammdaten/artikel/:id/edit" element={<ErrorBoundary><ArtikelEditPage /></ErrorBoundary>} />
        <Route path="/stammdaten/warengruppen" element={<ErrorBoundary><WarengruppenPage /></ErrorBoundary>} />
        <Route path="/stammdaten/warengruppen/:id/artikel" element={<ErrorBoundary><WarengruppeArtikelPage /></ErrorBoundary>} />
        <Route path="/stammdaten/vorlagen" element={<ErrorBoundary><VorlagenPage /></ErrorBoundary>} />

        {/* Document routes */}
        <Route path="/angebote" element={<ErrorBoundary><AngebotePage /></ErrorBoundary>} />
        <Route path="/angebote/new" element={<ErrorBoundary><QuoteCreationPage /></ErrorBoundary>} />
        <Route path="/angebote/:id" element={<ErrorBoundary><AngebotDetailPage /></ErrorBoundary>} />
        <Route path="/angebote/:id/edit" element={<ErrorBoundary><QuoteCreationPage /></ErrorBoundary>} />
        <Route path="/rechnungen" element={<ErrorBoundary><RechnungenPage /></ErrorBoundary>} />
        <Route path="/rechnungen/new" element={<ErrorBoundary><QuoteCreationPage /></ErrorBoundary>} />
        <Route path="/rechnungen/:id" element={<ErrorBoundary><RechnungDetailPage /></ErrorBoundary>} />
        <Route path="/rechnungen/:id/edit" element={<ErrorBoundary><QuoteCreationPage /></ErrorBoundary>} />
        <Route path="/storno" element={<ErrorBoundary><StornoPage /></ErrorBoundary>} />
        <Route path="/storno/:id" element={<ErrorBoundary><DocumentDetailPage type="ST" /></ErrorBoundary>} />

        <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />

        {/* Settings */}
        <Route path="/einstellungen" element={<ErrorBoundary><EinstellungenPage /></ErrorBoundary>} />

        {/* Legacy routes */}
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<NewCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id" element={<TemplateEditorPage />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={
        auth.user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />

      {/* Not found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
