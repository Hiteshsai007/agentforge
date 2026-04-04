import { useState, useEffect } from 'react';
import type { MarketplaceAgent } from '../../types';
import { getMarketplaceAgents, getMarketplaceCapabilities, addAgentToCompany } from '../../api/client';
import LoadingAnimation from '../shared/LoadingAnimation';
import EmptyState from '../shared/EmptyState';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  onAgentAdded: () => void;
  existingAgentIds?: string[];
}

export default function EnhancedMarketplace({ companyId, onAgentAdded, existingAgentIds = [] }: Props) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [agentsRes, capsRes] = await Promise.all([
          getMarketplaceAgents(filter),
          getMarketplaceCapabilities()
        ]);
        setAgents(agentsRes.agents);
        setCapabilities(capsRes.capabilities);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const filteredAgents = agents.filter(a =>
    a.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🌐 Global Marketplace</h2>
          <p className="text-gray-400">Discover and add AI agents to your portfolio</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="">All Capabilities</option>
            {capabilities.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingAnimation variant="pulse" size="lg" message="Loading marketplace..." />
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState 
          title="No agents found"
          description={searchQuery ? "Try different search terms" : "No agents available in this category"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
          {filteredAgents.map((agent, idx) => {
            const isFeatured = idx < 2; // First 2 are featured (larger)
            const isAlreadyAdded = existingAgentIds.includes(agent.agent_id);

            return (
              <div
                key={agent.agent_id}
                className={`card group overflow-hidden hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col ${
                  isFeatured ? 'lg:col-span-2 lg:row-span-2' : ''
                }`}
              >
                {/* Background with gradient */}
                <div className={`bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8 flex-1 flex flex-col justify-between ${isFeatured ? 'p-12' : ''}`}>
                  {/* Top section */}
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className={`font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors ${isFeatured ? 'text-3xl' : 'text-lg'}`}>
                          {agent.agent_name}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-4">
                          <span className="text-xs font-mono text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">
                            v{agent.version}
                          </span>
                          <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">by {agent.provider}</span>
                        </div>
                      </div>
                    </div>

                    <p className={`text-gray-300 mb-6 line-clamp-2 ${isFeatured ? 'text-base' : 'text-sm'}`}>
                      {agent.description}
                    </p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {agent.capabilities.slice(0, isFeatured ? 6 : 3).map(cap => (
                        <span key={cap} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300 hover:border-indigo-500/50 transition-colors">
                          {cap.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {agent.capabilities.length > (isFeatured ? 6 : 3) && (
                        <span className="text-xs px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300">
                          +{agent.capabilities.length - (isFeatured ? 6 : 3)} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom section with pricing and button */}
                  <div className="flex items-end justify-between gap-4 pt-6 border-t border-white/10">
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full border ${
                      agent.pricing_model === 'free'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {agent.pricing_model === 'free' ? '✨ Free' : '💎 Premium'}
                    </div>

                    {isAlreadyAdded ? (
                      <div className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg text-sm font-semibold cursor-not-allowed">
                        ✓ Added
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(agent)}
                        disabled={addingId === agent.agent_id}
                        className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                          addingId === agent.agent_id
                            ? 'bg-gray-500 text-gray-300 cursor-wait'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-500/20'
                        }`}
                      >
                        {addingId === agent.agent_id ? '⏳ Adding...' : '+ Add'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
