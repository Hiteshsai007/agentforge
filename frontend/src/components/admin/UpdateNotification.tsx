import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MarketplaceUpdate } from '../../types';
import { upgradeAgent } from '../../api/client';
import toast from 'react-hot-toast';


interface Props {
  update: MarketplaceUpdate;
  companyId: string;
  onClose: () => void;
  onApplied: () => void;
}

export default function UpdateNotification({ update, companyId, onClose, onApplied }: Props) {
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await upgradeAgent(companyId, update.current_agent_id, update.new_agent.agent_id);
      
      toast.success(`${update.agent_name} updated to v${update.new_agent.version}`);
      onApplied();
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };


  // Fake metrics derived from version diff for demo presentation
  const isMajor = update.new_agent.version.split('.')[0] !== update.current_version.split('.')[0];
  const qBoost = isMajor ? 24 : 12;
  const sBoost = isMajor ? 34 : 15;
  const rBoost = isMajor ? 4 : 2;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-[var(--bg-elevated)] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-6 border-b border-white/5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full mix-blend-screen" />
            <span className="text-3xl mb-4 block animate-bounce">🔔</span>
            <h2 className="text-2xl font-bold text-white mb-1">New Version Available</h2>
            <p className="text-indigo-200">{update.agent_name} has a new update</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-4 text-lg">
              <span className="font-mono text-gray-400 bg-black/30 px-3 py-1 rounded">v{update.current_version}</span>
              <span className="text-indigo-400">→</span>
              <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                v{update.new_agent.version}
              </span>
            </div>

            {/* Changelog */}
            {update.new_agent.changelog && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Improvements</h3>
                <div 
                  className="text-sm text-gray-300 prose prose-invert prose-p:my-1 prose-ul:my-1" 
                  dangerouslySetInnerHTML={{ __html: update.new_agent.changelog.replace(/\n-/g, '<br/>• ').replace(/##/g, '<strong class="text-white block mb-2">').replace(/\n/g, '</strong>') }}
                />
              </div>
            )}

            {/* Performance Comparison */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Performance Est.</h3>
              
              <div className="space-y-4">
                {/* Quality */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Quality Score</span>
                    <span className="text-emerald-400 font-mono">+{qBoost}% ⬆️</span>
                  </div>
                  <div className="flex h-2 bg-black/50 rounded-full overflow-hidden">
                    <div className="bg-gray-500 w-[72%]" />
                    <div className="bg-emerald-500 w-[12%] animate-pulse" />
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Execution Speed</span>
                    <span className="text-emerald-400 font-mono">+{sBoost}% faster ⬆️</span>
                  </div>
                  <div className="flex h-2 bg-black/50 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 w-[60%]" />
                    <div className="bg-gray-800 w-[40%]" />
                  </div>
                  <div className="flex h-2 bg-black/50 rounded-full overflow-hidden mt-1 relative">
                    <div className="bg-indigo-500 w-[40%]" />
                    <div className="bg-gray-800 w-[60%]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {/* Success */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="text-emerald-400 font-mono">+{rBoost}% ⬆️</span>
                  </div>
                  <div className="flex h-2 bg-black/50 rounded-full overflow-hidden">
                    <div className="bg-gray-500 w-[94%]" />
                    <div className="bg-emerald-500 w-[4%] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={handleApply}
                disabled={loading}
                className="primary-btn flex items-center gap-2"
              >
                {loading ? <span className="loading-dots">Updating</span> : "Update Now"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
