import { useState, useEffect } from 'react';
import type { CompanyAgent, MarketplaceUpdate } from '../../types';
import { getCompanyAgents, getCompanyUpdates, applyCompanyUpdates } from '../../api/client';
import AgentCard from './AgentCard';
import Marketplace from './Marketplace';
import OnboardingWizard from './OnboardingWizard';
import UpdateNotification from './UpdateNotification';
import CompanyAPISettings from './CompanyAPISettings';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  userEmail: string;
}

export default function Dashboard({ companyId, userEmail }: Props) {
  const [agents, setAgents] = useState<CompanyAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [manualUpdates, setManualUpdates] = useState<MarketplaceUpdate[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState<MarketplaceUpdate | null>(null);
  const [showAPISettings, setShowAPISettings] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { agents } = await getCompanyAgents(companyId);
      setAgents(agents);
      if (agents.length > 0) {
        checkUpdates();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkUpdates = async () => {
    try {
      const updates = await getCompanyUpdates(companyId);
      if (updates.upgrades.length > 0) {
        const auto = updates.upgrades.filter((u: MarketplaceUpdate) => u.auto_update);
        const manual = updates.upgrades.filter((u: MarketplaceUpdate) => !u.auto_update);
        
        setManualUpdates(manual);

        if (auto.length > 0) {
          await applyCompanyUpdates(companyId);
          toast.success(`${auto.length} agent(s) were automatically updated!`);
          fetchDashboard(); // Refresh to see new versions
        }
      }
    } catch (e) {
      console.error('Update check failed', e);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [companyId]);

  if (loading) {
    return <div className="page-container flex items-center justify-center"><div className="loading-dots text-white text-xl">Loading Portfolio</div></div>;
  }

  // Onboarding
  if (agents.length === 0 && !showMarketplace) {
    return <OnboardingWizard companyId={companyId} onComplete={fetchDashboard} />;
  }

  return (
    <div className="page-container space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {showAPISettings ? 'API Settings' : showMarketplace ? 'Marketplace' : 'Agent Portfolio'}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {showAPISettings 
              ? 'Manage your company API key and view available upgrades'
              : showMarketplace 
                ? 'Browse and add new AI agents to your portfolio'
                : 'Manage your company\'s active AI agents automatically.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {manualUpdates.length > 0 && (
            <button 
              onClick={() => setShowUpdateModal(manualUpdates[0])}
              className="px-4 py-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg flex items-center gap-2 font-medium transition-colors animate-pulse"
            >
              <span>🔔</span>
              {manualUpdates.length} Update{manualUpdates.length > 1 ? 's' : ''} Available
            </button>
          )}
          
          <button 
            onClick={() => setShowAPISettings(!showAPISettings)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 font-medium transition-colors ${
              showAPISettings 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            ⚙️ API Settings
          </button>
          
          <button 
            onClick={() => setShowMarketplace(!showMarketplace)}
            className="primary-btn flex items-center gap-2"
          >
            {showMarketplace ? 'Back to Portfolio' : (
              <><span className="text-lg leading-none">+</span> Browse Marketplace</>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {showAPISettings ? (
          <CompanyAPISettings companyId={companyId} />
        ) : showMarketplace ? (
          <Marketplace companyId={companyId} onAgentAdded={fetchDashboard} existingAgentIds={agents.map(a => a.agent_id)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                companyId={companyId}
                userEmail={userEmail}
                onUpdate={fetchDashboard}
              />
            ))}
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateNotification 
          update={showUpdateModal}
          companyId={companyId}
          onClose={() => setShowUpdateModal(null)}
          onApplied={() => {
            setShowUpdateModal(null);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}
