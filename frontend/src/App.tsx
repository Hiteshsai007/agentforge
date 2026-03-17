import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './components/admin/Dashboard';
import RequestInterface from './components/user/RequestInterface';
import DeveloperPortal from './components/developer/DeveloperPortal';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { getInviteCode } from './api/client';
import toast from 'react-hot-toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
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
  
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchInviteCode = () => {
    if (!company?.company_id) return;
    setInviteLoading(true);
    getInviteCode()
      .then(data => {
        setInviteCode(data.invite_code || 'N/A');
      })
      .catch(err => {
        console.error('Failed to get invite code:', err);
        setInviteCode('ERROR');
      })
      .finally(() => {
        setInviteLoading(false);
      });
  };

  useEffect(() => {
    if (company?.company_id) {
      fetchInviteCode();
    }
  }, [company]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="nav-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            AM
          </div>
          <span className="font-semibold tracking-wide text-lg text-white">Agent Marketplace</span>
        </div>
        
        <div className="flex items-center gap-4">
          {company && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm transition-colors"
            >
              🔗 Invite
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">{user?.full_name || user?.email}</span>
            <span className="text-xs text-gray-400">
              {company ? `Admin · ${company.company_name}` : 'Personal Account'}
            </span>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm transition-colors"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Invite Modal */}
      {showInviteModal && company && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#1a1a2e] border border-white/20 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Invite Team Members</h3>
              <p className="text-gray-400 text-sm mb-4">Share this invite code with your colleagues</p>
              
              <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-4">
                {inviteLoading ? (
                  <p className="text-gray-400">Loading...</p>
                ) : (
                  <p className="text-3xl font-mono font-bold text-green-400 tracking-wider">{inviteCode}</p>
                )}
              </div>
              
              <button
                onClick={copyInviteCode}
                disabled={inviteLoading || !inviteCode}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors mb-3 disabled:opacity-50"
              >
                Copy Invite Code
              </button>
              
              <p className="text-gray-500 text-xs">
                Company: {company.company_name}
              </p>
              
              <button
                onClick={() => setShowInviteModal(false)}
                className="mt-4 text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pt-16 relative">
        {user?.role === 'admin' && company && (
          <Dashboard companyId={company.company_id} userEmail={user.email} />
        )}
        {(!company || user?.role !== 'admin') && (
          <RequestInterface companyId={company?.company_id || ''} userId={user?.email || ''} />
        )}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ className: '!bg-[#1c1c21] !text-white border border-white/10' }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
