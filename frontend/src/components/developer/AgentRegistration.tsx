import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerAgent } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export default function AgentRegistration({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    version: '1.0.0',
    description: '',
    capabilities: '',
    provider: 'Devon Developer',
    input_type: 'text',
    output_type: 'text',
    pricing_model: 'free',
    api_endpoint: 'http://localhost:8000/api/mock/execute',
    health_check_endpoint: 'http://localhost:8000/health',
    changelog: 'Initial Release',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Parse capabilities
    const caps = formData.capabilities.split(',').map(c => c.trim()).filter(Boolean);
    if (caps.length === 0) {
      toast.error('Please enter at least one capability');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        capabilities: caps,
      };
      
      const res = await registerAgent(payload);
      if (res.success) {
        toast.success('Agent published successfully!');
        onClose();
      } else {
        toast.error(res.error || 'Failed to publish agent');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-[var(--bg-elevated)] border border-emerald-500/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="bg-emerald-900/40 p-6 border-b border-white/5 flex justify-between items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-1">Register New Agent</h2>
              <p className="text-emerald-200">Publish your AI model to the global marketplace</p>
            </div>
            
            <button 
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors text-2xl relative z-10"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Agent Name</label>
                <input 
                  required
                  value={formData.agent_name}
                  onChange={e => setFormData({...formData, agent_name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="e.g., SentimentPulse"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Version</label>
                <input 
                  required
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-medium">Description</label>
              <textarea 
                required
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[80px]"
                placeholder="Briefly describe what your agent does..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-medium flex justify-between">
                <span>Capabilities <span className="text-red-400">*</span></span>
                <span className="text-xs text-gray-500 font-normal">Comma-separated</span>
              </label>
              <input 
                required
                value={formData.capabilities}
                onChange={e => setFormData({...formData, capabilities: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g., text_summarization, sentiment_analysis"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Input Type</label>
                <select 
                  value={formData.input_type}
                  onChange={e => setFormData({...formData, input_type: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
                >
                  <option value="text">Text / Prompt</option>
                  <option value="image">Image URL / Base64</option>
                  <option value="audio">Audio stream</option>
                  <option value="json">Structured JSON</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Pricing Model</label>
                <select 
                  value={formData.pricing_model}
                  onChange={e => setFormData({...formData, pricing_model: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
                >
                  <option value="free">Free Tier</option>
                  <option value="pay_per_call">Pay per call</option>
                  <option value="subscription">Subscription</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Integration Endpoints</h4>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">API Endpoint</label>
                <input 
                  required
                  value={formData.api_endpoint}
                  onChange={e => setFormData({...formData, api_endpoint: e.target.value})}
                  className="w-full bg-black/30 border border-emerald-500/30 rounded px-3 py-1.5 text-sm text-emerald-100 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Health Check Endpoint</label>
                <input 
                  required
                  value={formData.health_check_endpoint}
                  onChange={e => setFormData({...formData, health_check_endpoint: e.target.value})}
                  className="w-full bg-black/30 border border-emerald-500/30 rounded px-3 py-1.5 text-sm text-emerald-100 focus:outline-none focus:border-emerald-400 font-mono transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-medium">Initial Changelog</label>
              <textarea 
                value={formData.changelog}
                onChange={e => setFormData({...formData, changelog: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                {loading ? <span className="loading-dots">Publishing</span> : 'Publish Agent'}
              </button>
            </div>
            
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
