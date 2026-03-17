import { useState, useEffect } from 'react';
import type { MarketplaceAgent } from '../../types';
import { getMarketplaceAgents, getMarketplaceCapabilities, addAgentToCompany } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  onAgentAdded: () => void;
  existingAgentIds?: string[];
}

export default function Marketplace({ companyId, onAgentAdded, existingAgentIds = [] }: Props) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMarketplaceAgents(filter),
      getMarketplaceCapabilities()
    ]).then(([agentsRes, capsRes]) => {
      setAgents(agentsRes.agents);
      setCapabilities(capsRes.capabilities);
      setLoading(false);
    }).catch(console.error);
  }, [filter]);

  const handleAdd = async (agent: MarketplaceAgent) => {
    setAddingId(agent.agent_id);
    try {
      await addAgentToCompany(companyId, agent.agent_id, true);
      toast.success(`${agent.agent_name} added to portfolio`);
      onAgentAdded();
    } catch {
      toast.error('Failed to add agent');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      {/* Search / Filter bar */}
      <div className="glass-panel p-4 flex items-center justify-between gap-4 sticky top-20 z-20 shadow-xl shadow-black/50">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-indigo-400">🌐</span> Global Marketplace
        </h2>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-medium">Filter by Capability:</span>
          <select 
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white min-w-[200px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Capabilities</option>
            {capabilities.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-dots">Loading Marketplace</div></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {agents.map(agent => (
            <div key={agent.agent_id} className="glass-panel p-6 flex items-start gap-6 hover:border-indigo-500/30 transition-colors group">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{agent.agent_name}</h3>
                  <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    v{agent.version}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">by {agent.provider}</span>
                </div>
                
                <p className="text-[var(--text-secondary)] mb-4">{agent.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300">
                      {cap.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 min-w-[140px]">
                <div className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {agent.pricing_model === 'free' ? 'Free to use' : 'Premium'}
                </div>
                
                {existingAgentIds.includes(agent.agent_id) ? (
                  <button disabled className="px-6 py-2 bg-white/5 text-gray-500 border border-white/5 rounded-lg text-sm font-semibold w-full cursor-not-allowed">
                    Added
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAdd(agent)}
                    disabled={addingId === agent.agent_id}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-semibold text-sm w-full shadow-lg shadow-indigo-500/20"
                  >
                    {addingId === agent.agent_id ? 'Adding...' : 'Add Agent'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {agents.length === 0 && (
            <div className="py-20 text-center text-[var(--text-secondary)]">
              No agents found matching "{filter}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
