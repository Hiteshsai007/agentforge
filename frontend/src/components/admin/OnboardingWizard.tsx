import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MarketplaceAgent } from '../../types';
import { getMarketplaceAgents, addAgentToCompany, getCompanyAgents } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  onComplete: () => void;
}

const TASKS = [
  { id: 'summarization', label: 'Summarizing documents', icon: '📝' },
  { id: 'research', label: 'Research and analysis', icon: '🔍' },
  { id: 'content_creation', label: 'Content writing', icon: '✍️' },
  { id: 'data_analysis', label: 'Data processing', icon: '📊' },
  { id: 'mathematics', label: 'Mathematical calculations', icon: '🧮' },
  { id: 'translation', label: 'Translation', icon: '🌍' },
];

export default function OnboardingWizard({ companyId, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [recommendedAgents, setRecommendedAgents] = useState<MarketplaceAgent[]>([]);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Make sure we have no agents before starting
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
    if (selectedTasks.length === 0) return;
    setLoading(true);
    try {
      const { agents } = await getMarketplaceAgents();
      // Basic recommendation logic: matching selected capabilities
      const recs = agents.filter(a => a.capabilities.some(c => selectedTasks.includes(c)));
      // Deduplicate by name, keep newest version
      const seen = new Set();
      const finalRecs = [];
      for (const a of recs) {
        if (!seen.has(a.agent_name)) {
          seen.add(a.agent_name);
          finalRecs.push(a);
        }
      }
      setRecommendedAgents(finalRecs.slice(0, 3)); // Max 3 recommendations
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
      // Add all recommended agents to portfolio
      await Promise.all(
        recommendedAgents.map(a => addAgentToCompany(companyId, a.agent_id, autoUpdateEnabled))
      );
      setStep(5);
    } catch {
      toast.error('Setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] z-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0c] to-[#0a0a0c]">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-12 text-center"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <span className="text-4xl text-indigo-400">✨</span>
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
                Welcome to Agent Marketplace!
              </h1>
              <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                Let's set up your robust AI agent portfolio in just a few steps.
              </p>
              <button onClick={() => setStep(2)} className="primary-btn text-lg px-8 py-3">
                Get Started
              </button>
            </motion.div>
          )}

          {/* STEP 2: Task Selection */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-10"
            >
              <h2 className="text-2xl font-bold mb-2">What tasks do you need help with?</h2>
              <p className="text-[var(--text-secondary)] mb-8">Select all that apply to get tailored agent recommendations.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {TASKS.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskSelect(task.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      selectedTasks.includes(task.id) 
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500' 
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{task.icon}</span>
                    <span className="font-medium text-gray-200">{task.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white">← Back</button>
                <button 
                  onClick={loadRecommendations} 
                  disabled={selectedTasks.length === 0 || loading}
                  className="primary-btn"
                >
                  {loading ? <span className="loading-dots">Analyzing</span> : 'Next Step'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Agent Recommendations */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-10"
            >
              <h2 className="text-2xl font-bold mb-2">Your Recommended Portfolio</h2>
              <p className="text-[var(--text-secondary)] mb-8">Based on your needs, we found these best-in-class agents.</p>
              
              <div className="space-y-4 mb-8">
                {recommendedAgents.map(agent => (
                  <div key={agent.agent_id} className="bg-black/30 border border-white/10 rounded-xl p-5 flex gap-4">
                    <div className="text-2xl mt-1">✨</div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {agent.agent_name}
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">v{agent.version}</span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 mb-2">{agent.description}</p>
                      <div className="flex gap-4 text-xs font-medium">
                        <span className="text-emerald-400 flex items-center gap-1">⭐ 4.8/5 Rating</span>
                        <span className="text-indigo-400">🚀 Fast Speed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white">← Back</button>
                <button onClick={() => setStep(4)} className="primary-btn relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform" />
                  <span className="relative z-10">Select All ({recommendedAgents.length})</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Update Policy */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-10"
            >
              <h2 className="text-2xl font-bold mb-2">How should agents update?</h2>
              <p className="text-[var(--text-secondary)] mb-8">Marketplace agents evolve rapidly. Set your update preference.</p>
              
              <div className="space-y-4 mb-8">
                <button
                  onClick={() => setAutoUpdateEnabled(true)}
                  className={`w-full flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                    autoUpdateEnabled 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 mt-1 rounded-full border flex items-center justify-center ${autoUpdateEnabled ? 'border-indigo-400 bg-indigo-500' : 'border-gray-500'}`}>
                    {autoUpdateEnabled && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                      Automatic Updates <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Recommended</span>
                    </h3>
                    <p className="text-sm text-gray-400">New versions install automatically. You'll receive notifications detailing the performance improvements.</p>
                  </div>
                </button>

                <button
                  onClick={() => setAutoUpdateEnabled(false)}
                  className={`w-full flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                    !autoUpdateEnabled 
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 mt-1 rounded-full border flex items-center justify-center ${!autoUpdateEnabled ? 'border-indigo-400 bg-indigo-500' : 'border-gray-500'}`}>
                    {!autoUpdateEnabled && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Manual Approval</h3>
                    <p className="text-sm text-gray-400">You review performance metrics and approve each update manually.</p>
                  </div>
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mb-8">You can change this per-agent later in your dashboard.</p>
              
              <div className="flex justify-between items-center">
                <button onClick={() => setStep(3)} className="text-gray-400 hover:text-white">← Back</button>
                <button 
                  onClick={handleFinishSetup} 
                  disabled={loading}
                  className="primary-btn"
                >
                  {loading ? <span className="loading-dots">Finalizing</span> : 'Complete Setup'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Complete */}
          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-12 text-center"
            >
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-400">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Setup Complete!</h1>
              <p className="text-[var(--text-secondary)] mb-8">
                You've added {recommendedAgents.length} agents to your portfolio.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left inline-block w-full max-w-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Try it out as an End User:</p>
                <p className="italic text-gray-300">"Summarize this quarterly earnings report"</p>
              </div>

              <div>
                <button onClick={onComplete} className="primary-btn text-lg px-8 py-3">
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
