import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './components/admin/Dashboard';
import RequestInterface from './components/user/RequestInterface';
import DeveloperPortal from './components/developer/DeveloperPortal';
import DocsPage from './pages/DocsPage';
import MarketplacePage from './pages/MarketplacePage';
import PremiumLayout from './components/PremiumLayout';
import PremiumNav from './components/PremiumNav';
import { Toaster } from 'react-hot-toast';

// Page wrappers for direct route access
function AdminPage() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user || !company) return <Navigate to="/login" replace />;
  return <Dashboard companyId={company.company_id} userEmail={user.email} onLogout={handleLogout} />;
}

function WorkPage() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-black">
      <PremiumNav onLogout={handleLogout} />
      <PremiumLayout navProps={{ onLogout: handleLogout }}>
        <div className="page-container py-8">
          <RequestInterface companyId={company?.company_id || ''} userId={user.email} />
        </div>
      </PremiumLayout>
    </div>
  );
}

function DeveloperPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user) return <Navigate to="/login" replace />;
  return <DeveloperPortal userEmail={user.email} onLogout={handleLogout} />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Render appropriate component based on user role */}
      {user.role === 'admin' && company ? (
        <Dashboard companyId={company.company_id} userEmail={user.email} onLogout={handleLogout} />
      ) : user.role === 'developer' ? (
        <DeveloperPortal userEmail={user.email} onLogout={handleLogout} />
      ) : user.role === 'user' || user.role === 'end_user' ? (
        <RequestInterface companyId={company?.company_id || ''} userId={user.email} onLogout={handleLogout} />
      ) : (
        <div className="flex items-center justify-center min-h-screen text-white">
          <p>Invalid user role: {user.role}</p>
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/work" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
      <Route path="/developer" element={<ProtectedRoute><DeveloperPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            className: '!bg-[#1c1c21] !text-white border border-white/10 shadow-lg shadow-black/50',
            success: { style: { background: '#16a34a', borderColor: '#22c55e' } },
            error: { style: { background: '#dc2626', borderColor: '#ef4444' } },
          }} 
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
