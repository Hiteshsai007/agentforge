import { useState } from 'react';
import type { CompanyAgent } from '../../types';
import { updateAgentSettings, removeAgent } from '../../api/client';
import CredentialDashboard from './CredentialDashboard';
import toast from 'react-hot-toast';

interface Props {
  agent: CompanyAgent;
  companyId: string;
  userEmail: string;
  onUpdate: () => void;
}

export default function AgentCard({ agent, companyId, userEmail, onUpdate }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'credentials'>('general');
  const [loading, setLoading] = useState(false);
  
  const mp = agent.agents_marketplace!;

  const handleToggleAutoUpdate = async () => {
    setLoading(true);
    try {
      await updateAgentSettings(companyId, agent.agent_id, {
        auto_update_enabled: !agent.auto_update_enabled
      });
      toast.success(agent.auto_update_enabled ? 'Auto-update disabled' : 'Auto-update enabled');
      onUpdate();
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${mp.agent_name}?`)) return;
    setLoading(true);
    try {
      await removeAgent(companyId, agent.agent_id);
      toast.success('Agent removed from portfolio');
      onUpdate();
    } catch {
      toast.error('Failed to remove agent');
    } finally {
      setLoading(false);
      setShowSettings(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'bg-emerald-500';
    if (score >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white">{mp.agent_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              v{mp.version}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              agent.status === 'updating' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {agent.status}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-xl opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Agent Settings"
        >
          ⚙️
        </button>
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 min-h-[40px] relative z-10">
        {mp.description}
      </p>

      {/* Primary Capability */}
      <div className="relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Capability</span>
        <span className="text-sm bg-white/5 border border-white/10 px-2 py-1 rounded w-fit inline-block text-gray-300">
          {mp.capabilities[0] || 'general'}
          {mp.capabilities.length > 1 && ` +${mp.capabilities.length - 1}`}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-white/10 relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block flex justify-between">
            <span>Quality</span>
            <span className="text-[10px] font-mono">{(agent.quality_score * 100).toFixed(0)}%</span>
          </span>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${getQualityColor(agent.quality_score)}`}
              style={{ width: `${agent.quality_score * 100}%` }}
            />
          </div>
        </div>
        
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Usage</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-medium leading-none">{agent.execution_count}</span>
            <span className="text-xs text-[var(--text-secondary)] leading-none">runs</span>
          </div>
        </div>
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-[var(--bg-elevated)]/95 backdrop-blur-md z-20 p-6 flex flex-col pt-12">
          <button 
            onClick={() => setShowSettings(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors font-mono"
          >
            ✕
          </button>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSettingsTab('general')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                settingsTab === 'general'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              ⚙️ General
            </button>
            <button
              onClick={() => setSettingsTab('credentials')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                settingsTab === 'credentials'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              🔑 Credentials
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {settingsTab === 'general' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
                  <div>
                    <div className="font-semibold mb-1">Auto-Update</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      Automatically install new versions when available
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={agent.auto_update_enabled}
                      onChange={handleToggleAutoUpdate}
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={handleRemove}
                    disabled={loading}
                    className="danger-btn w-full"
                  >
                    Remove Agent from Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <CredentialDashboard agent={agent} companyId={companyId} userEmail={userEmail} onUpdate={onUpdate} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
