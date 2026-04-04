import { useState, useEffect } from 'react';
import type { CompanyAgent, MarketplaceUpdate } from '../../types';
import { getCompanyAgents, getCompanyUpdates, applyCompanyUpdates } from '../../api/client';
import AgentCard from './AgentCard';
import Marketplace from './Marketplace';
import OnboardingWizard from './OnboardingWizard';
import UpdateNotification from './UpdateNotification';
import CompanyAPISettings from './CompanyAPISettings';
import MetricsDashboard from './MetricsDashboard';
import PremiumNav from '../PremiumNav';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  userEmail: string;
  onLogout?: () => void;
}

type DashboardTab = 'portfolio' | 'marketplace' | 'metrics' | 'settings';

export default function Dashboard({ companyId, userEmail, onLogout }: Props) {
  const [agents, setAgents] = useState<CompanyAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('portfolio');
  const [manualUpdates, setManualUpdates] = useState<MarketplaceUpdate[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState<MarketplaceUpdate | null>(null);

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
          fetchDashboard();
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
    return (
      <div className="min-h-screen bg-black">
        <PremiumNav userEmail={userEmail} onLogout={onLogout} />
        <div className="page-container flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-white font-medium">Loading portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding
  if (agents.length === 0 && activeTab === 'portfolio') {
    return (
      <div className="min-h-screen bg-black">
        <PremiumNav userEmail={userEmail} onLogout={onLogout} />
        <OnboardingWizard companyId={companyId} onComplete={fetchDashboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <PremiumNav userEmail={userEmail} onLogout={onLogout} />
      <div className="page-container space-y-8">
        {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2">Manage your AI agent portfolio and settings</p>
        </div>
        
        {manualUpdates.length > 0 && (
          <button 
            onClick={() => setShowUpdateModal(manualUpdates[0])}
            className="px-4 py-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg flex items-center gap-2 font-medium transition-colors animate-pulse"
          >
            <span>🔔</span>
            {manualUpdates.length} Update{manualUpdates.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-black/30 border border-white/10 rounded-xl p-2 w-fit">
        <Tab 
          active={activeTab === 'portfolio'} 
          onClick={() => setActiveTab('portfolio')}
          label="Portfolio"
          icon="🤖"
          badge={agents.length > 0 ? agents.length : undefined}
        />
        <Tab 
          active={activeTab === 'marketplace'} 
          onClick={() => setActiveTab('marketplace')}
          label="Marketplace"
          icon="🌐"
        />
        <Tab 
          active={activeTab === 'metrics'} 
          onClick={() => setActiveTab('metrics')}
          label="Metrics"
          icon="📊"
        />
        <Tab 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
          label="Settings"
          icon="⚙️"
        />
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Your Agent Portfolio</h2>
              <p className="text-gray-400">Manage and monitor your active AI agents</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('marketplace')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <span>+</span>
              <span>Browse Marketplace</span>
            </button>

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
          </div>
        )}

        {activeTab === 'marketplace' && (
          <Marketplace 
            companyId={companyId} 
            onAgentAdded={fetchDashboard} 
            existingAgentIds={agents.map(a => a.agent_id)} 
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsDashboard companyId={companyId} useCompanyMetrics={true} />
        )}

        {activeTab === 'settings' && (
          <CompanyAPISettings companyId={companyId} />
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
    </div>
  );
}

function Tab({ 
  active, 
  onClick, 
  label, 
  icon,
  badge
}: { 
  active: boolean
  onClick: () => void
  label: string
  icon: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 relative ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge && badge > 0 && (
        <span className="ml-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
