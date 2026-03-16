import { useState } from 'react';
import type { WorkflowStep, MarketplaceAgent } from '../../types';
import { addAgentToCompany } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  steps: WorkflowStep[];
  companyId: string;
  onRefreshDocs: () => void;
}

export default function MultiAgentWorkflow({ steps, companyId, onRefreshDocs }: Props) {
  const [addingCapability, setAddingCapability] = useState<string | null>(null);

  const handleAddAgent = async (agent: MarketplaceAgent, capability: string) => {
    setAddingCapability(capability);
    try {
      await addAgentToCompany(companyId, agent.agent_id, true);
      toast.success(`${agent.agent_name} added to portfolio`);
      onRefreshDocs(); // re-evaluates the intent to see if we can execute now
    } catch {
      toast.error('Failed to add agent');
    } finally {
      setAddingCapability(null);
    }
  };

  const missingSteps = steps.filter(s => s.status === 'missing');

  return (
    <div className="glass-panel p-6 w-full max-w-4xl mx-auto mt-8 animate-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          🔄
        </span>
        Multi-Agent Workflow Detetcted
      </h3>

      {missingSteps.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl mb-6">
          <p className="font-semibold mb-1">Missing Capabilities</p>
          <p className="text-sm opacity-90">
            This request requires multiple agents to complete. You have some of the required capabilities in your portfolio, but you need to add the missing ones before execution can begin.
          </p>
        </div>
      )}

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[var(--bg-base)] bg-white/10 text-white shadow shadow-white/10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold">{step.step}</span>
            </div>

            {/* Card */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border backdrop-blur-sm ${
              step.status === 'available' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {step.capability.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                  step.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {step.status}
                </span>
              </div>

              {step.status === 'available' && step.agent ? (
                <div>
                  <h4 className="font-bold text-white text-lg">{step.agent.agent_name}</h4>
                  <p className="text-sm text-gray-400 mt-1">v{step.agent.version} · Ready</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-300">Marketplace Options:</p>
                  {step.marketplace_options.slice(0, 2).map((opt) => (
                    <div key={opt.agent_id} className="bg-black/30 p-3 rounded-lg flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white text-sm">{opt.agent_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">⭐ {(opt.quality_score * 5).toFixed(1)}/5</div>
                      </div>
                      <button 
                        onClick={() => handleAddAgent(opt, step.capability)}
                        disabled={addingCapability === step.capability}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        {addingCapability === step.capability ? 'Adding...' : 'Add Agent'}
                      </button>
                    </div>
                  ))}
                  {step.marketplace_options.length === 0 && (
                    <div className="text-sm text-red-400 p-2 bg-red-500/10 rounded border border-red-500/20">
                      No marketplace agents found for this capability.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
