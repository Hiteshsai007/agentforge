import { useState } from 'react';
import type { User, Company } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  user: User | null;
  company: Company | null;
  logout: () => void;
  onInviteClick: () => void;
  activeTab: 'user' | 'admin' | 'developer';
  onTabChange: (tab: 'user' | 'admin' | 'developer') => void;
}

export default function Navbar({ user, company, logout, onInviteClick, activeTab, onTabChange }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'from-purple-500 to-pink-500';
    if (role === 'developer') return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#1c1c21]/95 to-[#1c1c21]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img 
              src="/logo.svg" 
              alt="AgentForge Logo" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                AgentForge
              </h1>
              <p className="text-xs text-gray-500">AI Agent Marketplace</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl p-1">
              <button
                onClick={() => onTabChange('user')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'user'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🚀 Work
              </button>
              
              {user.role === 'admin' && (
                <button
                  onClick={() => onTabChange('admin')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'admin'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ⚙️ Admin
                </button>
              )}
              
              {user.role === 'developer' && (
                <button
                  onClick={() => onTabChange('developer')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'developer'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💻 Developer
                </button>
              )}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {company && (
              <button
                onClick={onInviteClick}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <span className="text-lg">🔗</span>
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-white">{user?.full_name || user?.email}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${getRoleColor(user?.role || 'user')}`}>
                    {user?.role === 'admin' && '👑 Admin'}
                    {user?.role === 'developer' && '👨‍💻 Developer'}
                    {user?.role === 'end_user' && '👤 User'}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleColor(user?.role || 'user')} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1c1c21] border border-white/10 rounded-xl shadow-2xl py-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm text-gray-400">Logged in as</p>
                    <p className="text-sm font-semibold text-white">{user?.email}</p>
                  </div>

                  {company && (
                    <>
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Company</p>
                        <p className="text-sm font-semibold text-white">{company.company_name}</p>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.email || '');
                      toast.success('Email copied!');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    📋 Copy Email
                  </button>

                  <button
                    onClick={() => window.location.href = '/docs'}
                    className="w-full text-left px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    📖 API Documentation
                  </button>

                  <div className="border-t border-white/5 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-sm font-medium"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
