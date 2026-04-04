import { useState } from 'react';
import type { Intent, ExecutionResult } from '../../types';
import { parseIntent, executeAgent } from '../../api/client';
import MultiAgentWorkflow from './MultiAgentWorkflow';
import ExecutionResultsViewer from './ExecutionResultsViewer';
import PremiumLayout from '../PremiumLayout';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  userId: string;
  onLogout?: () => void;
}

export default function RequestInterface({ companyId, userId, onLogout }: Props) {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [delegationEnabled, setDelegationEnabled] = useState(false);

  const [intent, setIntent] = useState<Intent | null>(null);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Summarize the recent market trends report",
    "Analyze Q3 sales data and generate a chart",
    "Translate this product description to Spanish",
    "Research competitors in the AI agent space"
  ]);

  const handleSubmit = async (text: string = request) => {
    if (!text.trim()) return;

    // Reset state
    setIntent(null);
    setExecution(null);
    setParsing(true);
    setRequest(text);

    try {
      // 1. Parse Intent
      const parseRes = await parseIntent(text);
      if (!parseRes.success || !parseRes.intent) {
        toast.error(parseRes.error || 'Failed to understand request');
        if (parseRes.suggestions) setSuggestions(parseRes.suggestions);
        setParsing(false);
        return;
      }

      setIntent(parseRes.intent);
      setParsing(false);
      setLoading(true);

      // 2. Execute with delegation option
      const execRes = await executeAgent(parseRes.intent, companyId, userId, delegationEnabled);
      setExecution(execRes);

      if (!execRes.success && !execRes.routing?.is_multi_agent) {
        toast.error(execRes.error || 'Execution failed');
      } else if (execRes.success) {
        toast.success('Task completed successfully!');
      }

    } catch (e) {
      console.error(e);
      toast.error('An unexpected error occurred');
      setParsing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <PremiumLayout navProps={{ userEmail: userId, onLogout }}>
      <div className="page-container max-w-5xl flex flex-col items-center pt-20">

      {/* Header */}
      <div className="text-center w-full max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          What can I help you with?
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">
          Describe your task in plain English. Our intelligent router will find the right agent.
        </p>
      </div>

      {/* Input Area - Enhanced */}
      <div className="w-full max-w-4xl relative">
        {/* Background Glow Effects */}
        <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="glass-panel relative z-10 p-1 flex flex-col bg-gradient-to-b from-white/5 to-white/0 border border-white/10 overflow-hidden group">
          {/* Textarea */}
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your task..."
            className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-white p-6 ps-8 h-32 md:h-28 leading-relaxed text-lg placeholder-gray-500 font-medium"
            disabled={parsing || loading}
          />
          
          {/* Controls Bar */}
          <div className="px-6 pb-6 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
            {/* Delegation Toggle */}
            <label className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
              <input 
                type="checkbox" 
                checked={delegationEnabled}
                onChange={(e) => setDelegationEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 rounded-full peer-checked:bg-indigo-600 transition-colors relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:left-4 transition-all" />
              </div>
              <span className="text-xs font-medium text-gray-400 peer-checked:text-indigo-300 transition-colors">
                🔗 Multi-Agent
              </span>
            </label>

            {/* Submit Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono hidden sm:inline">⏎ Enter</span>
              <button
                onClick={() => handleSubmit()}
                disabled={parsing || loading || !request.trim()}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  request.trim() && !parsing && !loading
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/50'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                {parsing && <span className="animate-spin">⚙️</span>}
                {loading && <span className="animate-bounce">⚡</span>}
                {!parsing && !loading && <span>🚀</span>}
                <span>{parsing ? 'Parsing' : loading ? 'Executing' : 'Execute'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestions */}
        {!intent && !parsing && !loading && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center relative z-20 pointer-events-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(s)}
                className="px-4 py-2 rounded-full text-sm bg-white/5 border border-white/10 text-gray-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all cursor-pointer active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="w-full mt-16 mb-20 flex flex-col items-center min-h-[200px]">
        {/* Parsing State */}
        {parsing && (
          <div className="flex flex-col items-center gap-6 mt-12 animate-in fade-in duration-300">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30" />
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
                🧠
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Your Request</h3>
              <p className="text-gray-400">Understanding intent and extracting parameters...</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !parsing && intent && (
          <div className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-panel p-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-indigo-500/20">
                    <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-3">Processing Your Request</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Intent Understood</p>
                      <p className="text-white font-mono text-sm">{intent.intent}</p>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Required Capability</p>
                      <p className="text-indigo-300 font-mono text-sm">{intent.required_capability}</p>
                    </div>

                    {intent.is_multi_agent && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Multi-Agent Workflow Detected</p>
                        <p className="text-amber-100 text-sm mt-1">{intent.sub_tasks?.length || 0} steps will be coordinated</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mt-4">
                    Routing to best available agent in your portfolio...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {execution && !loading && (
          <div className="w-full max-w-4xl mx-auto">
            {execution.routing?.is_multi_agent && !execution.success ? (
              <MultiAgentWorkflow
                steps={execution.routing.workflow_steps}
                companyId={companyId}
                onRefreshDocs={() => handleSubmit(request)}
              />
            ) : (
              <ExecutionResultsViewer 
                execution={execution}
                intent={intent!}
                loading={false}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-8">
              <button
                onClick={() => {
                  setRequest('');
                  setExecution(null);
                  setIntent(null);
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg font-semibold text-white transition-all"
              >
                ✨ New Request
              </button>
              
              {execution.success && execution.result?.output && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(execution.result?.output || '');
                    toast.success('Result copied to clipboard!');
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-lg font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  📋 Copy Result
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!parsing && !loading && !execution && !intent && (
          <div className="text-center mt-20" />
        )}
      </div>

      </div>
    </PremiumLayout>
  );
}
