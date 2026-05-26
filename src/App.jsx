import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

// New adega pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Transactions from './pages/Transactions';
import MenuPage from './pages/MenuPage';
import ClientPortal from './pages/ClientPortal';
import ClientStore from './pages/ClientStore';
import PixApproval from './pages/PixApproval';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      {/* Admin only routes */}
      {isAdmin ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/clientes/:id" element={<ClientDetail />} />
          <Route path="/lancamentos" element={<Transactions />} />
          <Route path="/cardapio" element={<MenuPage />} />
          <Route path="/pix" element={<PixApproval />} />
        </Route>
      ) : (
        /* Client routes — redirect all to store */
        <>
          <Route path="/" element={<ClientStore user={user} />} />
          <Route path="*" element={<ClientStore user={user} />} />
        </>
      )}
      <Route path="/minha-area" element={<ClientPortal />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App