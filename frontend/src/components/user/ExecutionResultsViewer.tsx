import { useState } from 'react';
import type { ExecutionResult, Intent } from '../../types';
import { Copy, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  execution: ExecutionResult;
  intent: Intent;
  loading?: boolean;
}

export default function ExecutionResultsViewer({ execution, intent, loading = false }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'metadata' | 'routing'>('output');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadResult = () => {
    const content = JSON.stringify({
      execution_id: execution.execution_id,
      intent: intent,
      result: execution.result,
      timestamp: new Date().toISOString()
    }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution.execution_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-gray-400 font-medium">Executing your request...</p>
          <p className="text-xs text-gray-500">Please wait while we process your task</p>
        </div>
      </div>
    );
  }

  if (!execution.success) {
    return (
      <div className="glass-panel p-8 border border-red-500/20 bg-red-500/5">
        <div className="flex gap-4">
          <div className="text-4xl">❌</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-400 mb-2">Execution Failed</h3>
            <p className="text-gray-400">{execution.error || 'Unknown error'}</p>
            <div className="mt-4 text-xs font-mono text-gray-500 bg-black/30 p-3 rounded border border-white/5 max-h-40 overflow-auto">
              {execution.error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="text-5xl">✨</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-emerald-400 mb-1">Task Completed Successfully</h2>
            <p className="text-gray-400 text-sm">
              Execution ID: <span className="font-mono text-white">{execution.execution_id}</span>
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={downloadResult}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium text-gray-300 transition-all"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Execution Time</div>
          <div className="text-2xl font-bold text-white">{execution.execution_time.toFixed(2)}s</div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Tokens Used</div>
          <div className="text-2xl font-bold text-white">{execution.tokens_used.toLocaleString()}</div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Quality Score</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white">{(execution.quality_score * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Agents Used</div>
          <div className="text-2xl font-bold text-white">{execution.agents_used.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-black/20 p-2 rounded-xl">
        {(['output', 'metadata', 'routing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'output' && '📄 Output'}
            {tab === 'metadata' && '📊 Metadata'}
            {tab === 'routing' && '🎯 Routing'}
          </button>
        ))}
      </div>

      {/* Output Tab */}
      {activeTab === 'output' && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Execution Output</h3>
            <button
              onClick={() => copyToClipboard(execution.result?.output || '', 'output')}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-sm text-gray-400 hover:text-white"
            >
              {copiedId === 'output' ? <Check size={16} /> : <Copy size={16} />}
              {copiedId === 'output' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-lg p-6 max-h-96 overflow-auto font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
            {execution.result?.output || 'No output'}
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'metadata' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Request Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Original Request</p>
              <p className="text-sm text-gray-300">{intent.original_request}</p>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Intent</p>
              <p className="text-sm text-gray-300 font-mono">{intent.intent}</p>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Task Type</p>
              <p className="text-sm text-gray-300">{intent.task_type}</p>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${intent.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{(intent.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {intent.parameters && Object.keys(intent.parameters).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Parameters</p>
              <pre className="bg-black/50 p-4 rounded-lg border border-white/5 overflow-auto text-xs text-gray-400 font-mono max-h-48">
                {JSON.stringify(intent.parameters, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Routing Tab */}
      {activeTab === 'routing' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Routing & Agent Selection</h3>
          
          {execution.routing && (
            <div className="space-y-4">
              {execution.routing.selected_agent && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Selected Agent</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{execution.routing.selected_agent.agent_name}</p>
                      <p className="text-xs text-gray-400">v{execution.routing.selected_agent.version}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{((execution.routing.selected_agent.quality_score || 0) * 100).toFixed(0)}%</div>
                      <p className="text-xs text-gray-400">Quality Score</p>
                    </div>
                  </div>
                </div>
              )}

              {execution.routing.is_multi_agent && (
                <div>
                  <p className="text-sm font-semibold text-amber-400 mb-3">🔗 Multi-Agent Workflow</p>
                  <div className="space-y-2">
                    {execution.routing.workflow_steps?.map((step, idx) => (
                      <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 text-sm">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {step.step}
                          </span>
                          <span className="text-white font-semibold">{step.capability.replace(/_/g, ' ')}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            step.status === 'available' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        {step.agent && (
                          <p className="text-xs text-gray-400 ml-9">
                            Agent: <span className="text-gray-300">{step.agent.agent_name}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {execution.routing.missing_capabilities?.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">Missing Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {execution.routing.missing_capabilities.map((cap) => (
                      <span key={cap} className="text-xs bg-black/30 px-2 py-1 rounded text-amber-300">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
