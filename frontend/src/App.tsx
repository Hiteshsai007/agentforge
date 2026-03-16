import { useState } from 'react';
import type { Persona } from './types';
import PersonaSelector from './components/auth/PersonaSelector';
import Dashboard from './components/admin/Dashboard';
import RequestInterface from './components/user/RequestInterface';
import DeveloperPortal from './components/developer/DeveloperPortal';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [persona, setPersona] = useState<Persona | null>(null);

  if (!persona) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ className: '!bg-[#1c1c21] !text-white border border-white/10' }} />
        <PersonaSelector onSelect={setPersona} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" toastOptions={{ className: '!bg-[#1c1c21] !text-white border border-white/10' }} />
      
      {/* Global Header */}
      <header className="nav-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            AM
          </div>
          <span className="font-semibold tracking-wide text-lg text-white">Agent Marketplace</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">{persona.name}</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {persona.role === 'admin' ? `Admin · ${persona.company_name}` : 
               persona.role === 'end_user' ? `User · ${persona.company_name}` : 
               'Developer'}
            </span>
          </div>
          <button 
            onClick={() => setPersona(null)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-xl"
            title="Switch Persona"
          >
            {persona.role === 'admin' ? '🏢' : persona.role === 'end_user' ? '⚡' : '🛠'}
          </button>
        </div>
      </header>

      {/* Main Content Area Routing */}
      <main className="flex-1 pt-16 relative">
        {persona.role === 'admin' && <Dashboard companyId={persona.company_id!} />}
        {persona.role === 'end_user' && <RequestInterface companyId={persona.company_id!} userId={persona.email} />}
        {persona.role === 'developer' && <DeveloperPortal />}
      </main>
    </div>
  );
}
