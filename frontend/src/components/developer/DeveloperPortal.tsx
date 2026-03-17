import { useState } from 'react';
import AgentRegistration from './AgentRegistration';

export default function DeveloperPortal() {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <div className="page-container max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-black/40 p-8 rounded-3xl border border-white/5 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-4 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Developer Hub
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Build the Future of AI</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl">
            Register your agents, publish updates, and reach thousands of companies on the global marketplace.
          </p>
        </div>

        <div className="relative z-10 hidden md:block">
          <button 
            onClick={() => setShowRegistration(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>+</span> Publish New Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="glass-panel p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors cursor-default">
          <div className="text-emerald-400/50 group-hover:text-emerald-400 mb-4 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Total Executions</h3>
            <p className="text-4xl font-bold font-mono">1.2M+</p>
          </div>
          <div className="mt-4 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded w-fit">+14% this week</div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors cursor-default">
          <div className="text-indigo-400/50 group-hover:text-indigo-400 mb-4 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Active Companies</h3>
            <p className="text-4xl font-bold font-mono">4,892</p>
          </div>
          <div className="mt-4 text-xs text-gray-400 font-medium bg-white/5 px-2 py-1 rounded w-fit">Across 12 regions</div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors cursor-default">
          <div className="text-cyan-400/50 group-hover:text-cyan-400 mb-4 transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Estimated Payout</h3>
            <p className="text-4xl font-bold font-mono">$18.4k</p>
          </div>
          <div className="mt-4 text-xs text-cyan-400 font-medium bg-cyan-500/10 px-2 py-1 rounded w-fit">Next payout in 4 days</div>
        </div>
      </div>

      {/* Docs link */}
      <div className="border border-dashed border-white/20 rounded-2xl p-8 text-center mt-8">
        <h3 className="text-xl font-bold mb-2">Build Your First Agent</h3>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-6">
          Follow our comprehensive guide to integrate your AI models with the marketplace using standard HTTP endpoints.
        </p>
        <button className="secondary-btn">Read Documentation</button>
      </div>

      {/* Modals */}
      {showRegistration && <AgentRegistration onClose={() => setShowRegistration(false)} />}
    </div>
  );
}
