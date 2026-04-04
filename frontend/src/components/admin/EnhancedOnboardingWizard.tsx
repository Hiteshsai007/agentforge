import { useState, useEffect } from 'react';
import type { MarketplaceAgent } from '../../types';
import { getMarketplaceAgents, addAgentToCompany, getCompanyAgents } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  onComplete: () => void;
}

const TASKS = [
  { id: 'summarization', label: 'Summarizing documents', icon: '📝', color: 'blue' },
  { id: 'research', label: 'Research and analysis', icon: '🔍', color: 'purple' },
  { id: 'content_creation', label: 'Content writing', icon: '✍️', color: 'indigo' },
  { id: 'data_analysis', label: 'Data processing', icon: '📊', color: 'cyan' },
  { id: 'mathematics', label: 'Mathematical calculations', icon: '🧮', color: 'emerald' },
  { id: 'translation', label: 'Translation', icon: '🌍', color: 'pink' },
];

export default function EnhancedOnboardingWizard({ companyId, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [recommendedAgents, setRecommendedAgents] = useState<MarketplaceAgent[]>([]);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCompanyAgents(companyId).then(({ agents }) => {
      if (agents.length > 0) onComplete();
    });
  }, [companyId, onComplete]);

  const handleTaskSelect = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const loadRecommendations = async () => {
    if (selectedTasks.length === 0) {
      toast.error('Please select at least one task');
      return;
    }
    setLoading(true);
    try {
      const { agents } = await getMarketplaceAgents();
      const recs = agents.filter(a => a.capabilities.some(c => selectedTasks.includes(c)));
      const seen = new Set();
      const finalRecs = [];
      for (const a of recs) {
        if (!seen.has(a.agent_name)) {
          seen.add(a.agent_name);
          finalRecs.push(a);
        }
      }
      setRecommendedAgents(finalRecs.slice(0, 4));
      setStep(3);
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      await Promise.all(
        recommendedAgents.map(a => addAgentToCompany(companyId, a.agent_id, autoUpdateEnabled))
      );
      setStep(5);
      setTimeout(onComplete, 1000);
    } catch {
      toast.error('Setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-black to-indigo-950/20 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full animate-float pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-2xl relative z-10">
        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="card p-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
              <span className="text-5xl">✨</span>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
                Welcome to AgentForge!
              </h1>
              <p className="text-lg text-gray-400 max-w-md mx-auto">
                Let's set up your first AI agents. We'll recommend the perfect agents based on your needs.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary mx-auto px-8"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* STEP 2: Select Tasks */}
        {step === 2 && (
          <div className="card p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">What do you need?</h2>
              <p className="text-gray-400">Select the tasks you'd like help with</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TASKS.map((task, idx) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    selectedTasks.includes(task.id)
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-indigo-500/50'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="text-3xl mb-3 block">{task.icon}</span>
                  <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{task.label}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-white font-semibold hover:bg-white/5 rounded-lg transition-colors flex-1"
              >
                ← Back
              </button>
              <button
                onClick={loadRecommendations}
                disabled={selectedTasks.length === 0 || loading}
                className={`px-6 py-3 font-semibold rounded-lg flex-1 transition-all ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-wait'
                    : selectedTasks.length === 0
                    ? 'bg-white/5 text-gray-400 cursor-not-allowed'
                    : 'btn btn-primary'
                }`}
              >
                {loading ? '⏳ Finding agents...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Recommendations */}
        {step === 3 && (
          <div className="card p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Perfect agents for you</h2>
              <p className="text-gray-400">We've found {recommendedAgents.length} great agents matching your needs</p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recommendedAgents.map((agent, idx) => (
                <div
                  key={agent.agent_id}
                  className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all animate-in fade-in slide-in-from-left-4 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-2">{agent.agent_name}</h4>
                      <p className="text-sm text-gray-400 mb-3">{agent.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.slice(0, 4).map(cap => (
                          <span key={cap} className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">
                            {cap.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      agent.pricing_model === 'free'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {agent.pricing_model === 'free' ? 'Free' : 'Premium'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={autoUpdateEnabled}
                onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                className="mt-1 cursor-pointer"
                id="auto-update"
              />
              <label htmlFor="auto-update" className="text-sm text-gray-300 cursor-pointer">
                <span className="font-semibold text-white">Auto-update agents</span> - Automatically apply marketplace updates
              </label>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 text-white font-semibold hover:bg-white/5 rounded-lg transition-colors flex-1"
              >
                ← Back
              </button>
              <button
                onClick={handleFinishSetup}
                disabled={loading}
                className={`px-6 py-3 font-semibold rounded-lg flex-1 transition-all ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-wait'
                    : 'btn btn-primary'
                }`}
              >
                {loading ? '⏳ Setting up...' : 'Finish Setup →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && (
          <div className="card p-12 text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-bounce">
              <span className="text-5xl">🎉</span>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white mb-2">You're all set!</h2>
              <p className="text-gray-400 text-lg">
                {recommendedAgents.length} {recommendedAgents.length === 1 ? 'agent' : 'agents'} have been added to your portfolio
              </p>
            </div>
            <button
              onClick={onComplete}
              className="btn btn-primary mx-auto px-8"
            >
              Enter Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
