import { useState } from 'react';
import type { Intent, ExecutionResult } from '../../types';
import { parseIntent, executeAgent } from '../../api/client';
import MultiAgentWorkflow from './MultiAgentWorkflow';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  userId: string;
}

export default function RequestInterface({ companyId, userId }: Props) {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

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

      // 2. Execute
      const execRes = await executeAgent(parseRes.intent, companyId, userId);
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
    <div className="page-container max-w-5xl flex flex-col items-center">

      {/* Header */}
      <div className="text-center w-full max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          What can I help you with?
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">
          Describe your task in plain English. Our intelligent router will find the right agent.
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl relative">
        {/* Glow behind input */}
        <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl transition-opacity duration-500 opacity-50 pointer-events-none" />

        <div className="glass-panel relative z-10 p-2 flex bg-[var(--bg-surface)]/80">
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your request here..."
            className="w-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-white p-4 h-32 md:h-16 lead text-lg"
            disabled={parsing || loading}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono hidden md:inline">Press Enter ↵</span>
            <button
              onClick={() => handleSubmit()}
              disabled={parsing || loading || !request.trim()}
              className={`p-3 rounded-xl transition-all ${request.trim() && !parsing && !loading
                  ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:bg-cyan-500'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
            >
              {parsing ? '🧠' : loading ? '⚡' : '🚀'}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {!intent && !parsing && (
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(s)}
                className="px-4 py-2 rounded-full text-sm bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
              >
                "{s}"
              </button>
            ))}
          </div>
        )}
      </div>

      {/* States */}
      <div className="w-full mt-12 mb-20 flex flex-col items-center min-h-[400px]">
        {parsing && (
          <div className="flex flex-col items-center gap-4 text-cyan-400 animate-pulse mt-20">
            <div className="w-16 h-16 rounded-full border-4 border-t-cyan-400 border-r-cyan-400/30 border-b-cyan-400/10 border-l-cyan-400/30 animate-spin" />
            <p className="font-medium tracking-wider uppercase text-sm">Analyzing Intent...</p>
          </div>
        )}

        {loading && !parsing && intent && (
          <div className="flex flex-col items-center gap-6 mt-10">
            <div className="glass-panel p-6 border-cyan-500/30 w-full max-w-xl text-center bg-cyan-900/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-2">Intent Parsed</span>
              <p className="font-medium text-white mb-4">Required Capability: <span className="bg-cyan-500/20 px-2 py-1 rounded text-cyan-300">{intent.required_capability}</span></p>

              <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-secondary)]">
                <span className="loading-dots">Routing to best agent in portfolio</span>
              </div>
            </div>
          </div>
        )}

        {/* Execution Results */}
        {execution && !loading && (
          <div className="w-full animate-in slide-in-from-bottom-8 duration-700">

            {/* Multi-Agent Handling */}
            {execution.routing?.is_multi_agent && !execution.success ? (
              <MultiAgentWorkflow
                steps={execution.routing.workflow_steps}
                companyId={companyId}
                onRefreshDocs={() => handleSubmit(request)}
              />
            ) : !execution.success ? (
              <div className="glass-panel p-8 text-center max-w-2xl mx-auto bg-red-900/10 border-red-500/20">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-400 mb-2">Task Failed</h3>
                <p className="text-gray-300 mb-6">{execution.error}</p>

                {/* Fallback to Marketplace suggestion */}
                {execution.routing?.alternatives && execution.routing.alternatives.length > 0 && (
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-left">
                    <p className="text-sm font-semibold mb-3">Marketplace Alternative Available:</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{execution.routing.alternatives[0]?.agent_name}</span>
                        <span className="text-xs text-emerald-400 ml-2">
                          ⭐ {((execution.routing.alternatives[0]?.quality_score ?? 0) * 5).toFixed(1)}/5
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 italic">Contact Admin to add</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Success State */
              <div className="glass-panel p-0 max-w-3xl mx-auto overflow-hidden shadow-2xl shadow-cyan-500/10">
                <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Task Completed</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Handled by <span className="text-cyan-400">{execution.agents_used.join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs font-mono text-[var(--text-secondary)] text-right">
                    <div>
                      <span className="block text-gray-500 uppercase tracking-widest text-[10px]">Time</span>
                      {execution.execution_time}s
                    </div>
                    <div>
                      <span className="block text-gray-500 uppercase tracking-widest text-[10px]">Tokens</span>
                      {execution.tokens_used.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-8 pb-12">
                  <div className="prose prose-invert max-w-none text-gray-200">
                    {/* Simulated markdown rendering */}
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {execution.result?.output}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2 justify-end">
                  <button onClick={() => { setRequest(''); setExecution(null); }} className="secondary-btn">New Request</button>
                  <button className="primary-btn bg-cyan-600 hover:bg-cyan-500 text-white shadow shadow-cyan-500/20">Copy Result</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
