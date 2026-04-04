import { useState, useEffect } from 'react';
import { getAdminMetrics, getCompanyMetrics } from '../../api/client';

interface MetricsData {
  agent_name: string;
  agent_id: string;
  time_period: string;
  metrics: {
    total_executions: number;
    success_rate: number;
    average_quality_score: number;
    average_execution_time: number;
    total_tokens_used: number;
    estimated_cost: number;
  };
  quality_trend: Array<{ date: string; score: number }>;
  recent_failures: Array<{ execution_id: string; error: string; timestamp: string }>;
}

interface CompanyMetricsData {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  avg_response_time: number;
  agents: Array<{
    agent_id: string;
    agent_name: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time: number;
  }>;
  daily_requests: Array<{ date: string; count: number }>;
}

interface Props {
  companyId: string;
  agentId?: string;
  useCompanyMetrics?: boolean; // If true, fetches company-wide metrics, else agent-specific
}

export default function MetricsDashboard({ companyId, agentId, useCompanyMetrics = false }: Props) {
  const [agentMetrics, setAgentMetrics] = useState<MetricsData | null>(null);
  const [companyMetricsData, setCompanyMetricsData] = useState<CompanyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        if (useCompanyMetrics) {
          const data = await getCompanyMetrics(companyId, timeRange);
          setCompanyMetricsData(data);
        } else {
          const data = await getAdminMetrics(companyId, agentId || undefined);
          setAgentMetrics(data);
        }
      } catch (error) {
        console.error('Failed to load metrics:', error);
        // Don't show error toast - metrics are optional and data can be populated when agents are used
        // Metrics will become available once agents start being executed
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [companyId, agentId, timeRange, useCompanyMetrics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-gray-400">Loading metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (useCompanyMetrics) {
    // Company-wide metrics view
    if (!companyMetricsData) {
      return (
        <div className="space-y-6">
          <div className="grid place-items-center h-96 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-300 text-lg font-semibold mb-2">No metrics available yet</p>
              <p className="text-gray-400 text-sm">Metrics will appear here once you start executing agents. Run your first agent request to see performance data.</p>
            </div>
          </div>
        </div>
      );
    }

    const m = companyMetricsData;

    return (
      <div className="space-y-6">
        {/* Header with Time Range */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Performance Metrics</h2>
            <p className="text-gray-400">Track agent requests and performance</p>
          </div>

          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={m.total_requests.toLocaleString()}
            icon="📊"
            color="indigo"
          />
          <StatCard
            label="Success Rate"
            value={`${m.success_rate.toFixed(1)}%`}
            icon="✅"
            color="emerald"
          />
          <StatCard
            label="Avg Response Time"
            value={`${m.avg_response_time.toFixed(0)}ms`}
            icon="⚡"
            color="blue"
          />
          <StatCard
            label="Failed Requests"
            value={m.failed_requests.toLocaleString()}
            icon="❌"
            color="red"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Timeline */}
          <div className="lg:col-span-2 bg-black/20 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Request Timeline</h3>
            <div className="h-64 flex items-end gap-1 justify-between">
              {m.daily_requests.map((day, idx) => {
                const maxCount = Math.max(...m.daily_requests.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all hover:from-indigo-500 hover:to-indigo-300 cursor-pointer group-hover:opacity-100 opacity-75"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-500 mt-2 group-hover:text-gray-300 transition-colors">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                      {day.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Distribution */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Request Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Successful</span>
                  <span className="text-white font-semibold">{m.successful_requests}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${m.success_rate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Failed</span>
                  <span className="text-white font-semibold">{m.failed_requests}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${100 - m.success_rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent-wise Breakdown */}
        {m.agents.length > 0 && (
          <div className="bg-black/20 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Agent Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Agent</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Requests</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Success Rate</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Avg Response</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {m.agents.map(agent => (
                    <tr key={agent.agent_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{agent.agent_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{agent.agent_id}</div>
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {agent.total_requests.toLocaleString()}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                agent.success_rate >= 90
                                  ? 'bg-emerald-500'
                                  : agent.success_rate >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${agent.success_rate}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold min-w-[3rem] text-right">
                            {agent.success_rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-white">
                        {agent.avg_response_time.toFixed(0)}ms
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            agent.success_rate >= 90
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : agent.success_rate >= 70
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {agent.success_rate >= 90 ? 'Healthy' : agent.success_rate >= 70 ? 'Warning' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Agent-specific metrics view (original)
  if (!agentMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid place-items-center h-96 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📈</div>
            <p className="text-gray-300 text-lg font-semibold mb-2">No metrics available yet</p>
            <p className="text-gray-400 text-sm">Metrics for this agent will appear here once it starts being executed.</p>
          </div>
        </div>
      </div>
    );
  }

  const m = agentMetrics.metrics;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-6 border-l-2 border-l-emerald-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Success Rate</div>
          <div className="text-4xl font-bold text-white mb-2">{(m.success_rate * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-400">{m.total_executions} total executions</div>
        </div>

        <div className="glass-panel p-6 border-l-2 border-l-indigo-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Quality Score</div>
          <div className="text-4xl font-bold text-white mb-2">{(m.average_quality_score * 100).toFixed(0)}%</div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${m.average_quality_score * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-6 border-l-2 border-l-cyan-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Avg Execution Time</div>
          <div className="text-4xl font-bold text-white mb-2">{m.average_execution_time.toFixed(2)}s</div>
          <div className="text-xs text-gray-400">Across all runs</div>
        </div>

        <div className="glass-panel p-6 border-l-2 border-l-purple-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Tokens Used</div>
          <div className="text-3xl font-bold text-white mb-2">{(m.total_tokens_used / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-400">${m.estimated_cost.toFixed(4)} estimated cost</div>
        </div>

        <div className="glass-panel p-6 border-l-2 border-l-pink-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Estimated Cost</div>
          <div className="text-3xl font-bold text-white">${m.estimated_cost.toFixed(6)}</div>
          <div className="text-xs text-gray-400">Based on current pricing</div>
        </div>

        <div className="glass-panel p-6 border-l-2 border-l-amber-500">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Period</div>
          <div className="text-lg font-semibold text-white capitalize">{agentMetrics.time_period.replace('_', ' ')}</div>
          <div className="text-xs text-gray-400 mt-2">All-time data</div>
        </div>
      </div>

      {/* Quality Trend Chart (Simple) */}
      {agentMetrics.quality_trend.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            📈 Quality Trend Over Time
          </h3>
          
          <div className="space-y-2">
            {agentMetrics.quality_trend.map((point, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-24 text-xs font-mono text-gray-400">{point.date}</div>
                <div className="flex-1 h-8 bg-black/30 rounded-lg overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-end pr-2 text-white text-xs font-bold"
                    style={{ width: `${point.score * 100}%` }}
                  >
                    {point.score > 0.3 && (point.score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-mono text-gray-300">{(point.score * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Failures */}
      {agentMetrics.recent_failures.length > 0 && (
        <div className="glass-panel p-6 border-l-2 border-l-red-500">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            ⚠️ Recent Failures ({agentMetrics.recent_failures.length})
          </h3>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {agentMetrics.recent_failures.map((failure, idx) => (
              <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-mono text-gray-400 truncate">{failure.execution_id}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(failure.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-red-300">{failure.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {agentMetrics.recent_failures.length === 0 && (
        <div className="glass-panel p-8 text-center bg-emerald-500/5 border-emerald-500/20">
          <p className="text-emerald-400 font-medium">✨ No recent failures - great job!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = 'indigo',
  trend,
  trendUp
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: 'indigo' | 'emerald' | 'blue' | 'red';
  trend?: string;
  trendUp?: boolean;
}) {
  const colorClasses = {
    indigo: 'from-indigo-600/20 to-indigo-500/10 border-indigo-500/30',
    emerald: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/30',
    blue: 'from-blue-600/20 to-blue-500/10 border-blue-500/30',
    red: 'from-red-600/20 to-red-500/10 border-red-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            trendUp ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
