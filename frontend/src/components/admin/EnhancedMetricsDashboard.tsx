import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAdminMetrics, getCompanyMetrics } from '../../api/client';
import LoadingAnimation from '../shared/LoadingAnimation';
import EmptyState from '../shared/EmptyState';

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
  useCompanyMetrics?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: number;
  color?: 'indigo' | 'emerald' | 'blue' | 'red';
}

function StatCard({ label, value, icon, trend, color = 'indigo' }: StatCardProps) {
  const colorMap: Record<'indigo' | 'emerald' | 'blue' | 'red', string> = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-200',
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-200',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-200',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-200',
  };

  return (
    <div className={`card p-6 bg-gradient-to-br ${colorMap[color]} border transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${trend > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-gray-300 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function EnhancedMetricsDashboard({ companyId, agentId, useCompanyMetrics = false }: Props) {
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
        toast.error('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [companyId, agentId, timeRange, useCompanyMetrics]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingAnimation variant="bars" message="Loading analytics..." />
      </div>
    );
  }

  if (useCompanyMetrics) {
    if (!companyMetricsData) {
      return <EmptyState title="No metrics available" description="Start using agents to see analytics" />;
    }

    const m = companyMetricsData;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header with Time Range */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Performance Analytics</h2>
            <p className="text-gray-400">Track all agent requests and performance metrics</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Requests"
            value={m.total_requests.toLocaleString()}
            icon="📊"
            color="indigo"
            trend={12}
          />
          <StatCard
            label="Success Rate"
            value={`${m.success_rate.toFixed(1)}%`}
            icon="✅"
            color="emerald"
            trend={5}
          />
          <StatCard
            label="Avg Response Time"
            value={`${m.avg_response_time.toFixed(0)}ms`}
            icon="⚡"
            color="blue"
            trend={-8}
          />
          <StatCard
            label="Failed Requests"
            value={m.failed_requests.toLocaleString()}
            icon="❌"
            color="red"
            trend={-3}
          />
        </div>

        {/* Agents Breakdown */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">Agent Breakdown</h3>
          <div className="grid gap-4">
            {m.agents.map(agent => (
              <div key={agent.agent_id} className="card p-6 flex items-center justify-between hover:border-indigo-500/30 transition-colors group">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">{agent.agent_name}</h4>
                  <div className="flex gap-6 text-sm text-gray-400">
                    <span>Requests: <span className="text-white font-semibold">{agent.total_requests}</span></span>
                    <span>Success: <span className="text-emerald-400 font-semibold">{agent.successful_requests}</span></span>
                    <span>Failed: <span className="text-red-400 font-semibold">{agent.failed_requests}</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{agent.success_rate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">success rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Agent-specific metrics
  if (!agentMetrics) {
    return <EmptyState title="No metrics available" description="This agent hasn't been executed yet" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">{agentMetrics.agent_name} Metrics</h2>
        <p className="text-gray-400">Period: {agentMetrics.time_period}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Executions"
          value={agentMetrics.metrics.total_executions}
          icon="▶️"
          color="indigo"
        />
        <StatCard
          label="Success Rate"
          value={`${agentMetrics.metrics.success_rate.toFixed(1)}%`}
          icon="✅"
          color="emerald"
        />
        <StatCard
          label="Quality Score"
          value={agentMetrics.metrics.average_quality_score.toFixed(2)}
          icon="⭐"
          color="blue"
        />
        <StatCard
          label="Avg Exec Time"
          value={`${agentMetrics.metrics.average_execution_time.toFixed(1)}s`}
          icon="⏱️"
          color="indigo"
        />
        <StatCard
          label="Tokens Used"
          value={`${(agentMetrics.metrics.total_tokens_used / 1000).toFixed(1)}k`}
          icon="🔤"
          color="blue"
        />
        <StatCard
          label="Est. Cost"
          value={`$${agentMetrics.metrics.estimated_cost.toFixed(2)}`}
          icon="💰"
          color="emerald"
        />
      </div>

      {agentMetrics.recent_failures.length > 0 && (
        <div className="card p-8 border-red-500/20 bg-red-500/5">
          <h3 className="text-xl font-bold text-red-300 mb-6">⚠️ Recent Failures</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {agentMetrics.recent_failures.map((failure, idx) => (
              <div key={idx} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-200">{failure.error}</p>
                <p className="text-xs text-red-400/70 mt-2">{failure.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
