import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Persona, Company } from '../../types';
import { getAllCompanies, createCompany } from '../../api/client';

interface Props {
  onSelect: (persona: Persona) => void;
}

const PERSONAS = [
  {
    role: 'admin' as const,
    label: 'Company Admin',
    subtitle: 'Manage AI agents & portfolio',
    icon: '🏢',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    glow: 'shadow-violet-500/50',
    border: 'border-violet-500/30',
    description: 'Browse the marketplace, configure agents, manage update policies, and monitor your company\'s AI portfolio.',
    features: ['Agent Portfolio', 'Marketplace Access', 'Auto-Updates', 'Usage Analytics'],
  },
  {
    role: 'end_user' as const,
    label: 'End User',
    subtitle: 'Get things done with AI',
    icon: '⚡',
    gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    glow: 'shadow-cyan-500/50',
    border: 'border-cyan-500/30',
    description: 'Submit natural language requests and let intelligent agents handle the work for you automatically.',
    features: ['Natural Language', 'Smart Routing', 'Multi-Agent', 'Instant Results'],
  },
  {
    role: 'developer' as const,
    label: 'Agent Developer',
    subtitle: 'Build & publish agents',
    icon: '🛠',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    glow: 'shadow-emerald-500/50',
    border: 'border-emerald-500/30',
    description: 'Register new agents to the global marketplace, publish updates, and track adoption metrics.',
    features: ['Agent Registration', 'Version Management', 'Adoption Metrics', 'API Integration'],
  },
];

export default function PersonaSelector({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<typeof PERSONAS[0] | null>(null);

  const handleCardClick = async (p: typeof PERSONAS[0]) => {
    setSelected(p.role);
    setPendingRole(p);

    if (p.role === 'developer') {
      // Developer doesn't need a company
      setTimeout(() => {
        onSelect({ role: p.role, name: 'Devon Developer', email: 'dev@agentco.com' });
      }, 600);
      return;
    }

    setLoading(true);
    try {
      const { companies: list } = await getAllCompanies();
      setCompanies(list);
      setShowCompanyPicker(true);
    } catch {
      // If backend not running, use mock
      setCompanies([{ company_id: 'demo', company_name: 'Acme Corp', created_at: '', settings: {} }]);
      setShowCompanyPicker(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    if (!pendingRole) return;
    const names: Record<string, string> = {
      admin: 'Alex Admin',
      end_user: 'Sam User',
    };
    const emails: Record<string, string> = {
      admin: 'admin@acme.com',
      end_user: 'user@acme.com',
    };
    onSelect({
      role: pendingRole.role,
      name: names[pendingRole.role] || 'User',
      email: emails[pendingRole.role] || 'user@example.com',
      company_id: company.company_id,
      company_name: company.company_name,
    });
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !pendingRole) return;
    setLoading(true);
    try {
      const { company } = await createCompany(newCompanyName.trim());
      handleCompanySelect(company);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="persona-selector">
      {/* Background */}
      <div className="persona-bg">
        <div className="persona-orb orb-1" />
        <div className="persona-orb orb-2" />
        <div className="persona-orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* Content */}
      <div className="persona-content">
        {/* Header */}
        <motion.div
          className="persona-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="persona-badge">AI Agent Marketplace</div>
          <h1 className="persona-title">
            Who are you
            <span className="gradient-text"> today?</span>
          </h1>
          <p className="persona-subtitle">
            Select your role to enter the right experience
          </p>
        </motion.div>

        {/* Cards */}
        <div className="persona-cards">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.role}
              className={`persona-card ${selected === p.role ? 'persona-card--selected' : ''} ${p.border}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !loading && handleCardClick(p)}
            >
              {/* Glow layer */}
              <div className={`card-glow bg-gradient-to-br ${p.gradient}`} />

              {/* Icon */}
              <div className={`persona-icon bg-gradient-to-br ${p.gradient}`}>
                <span>{p.icon}</span>
              </div>

              {/* Text */}
              <div className="persona-card-body">
                <h3 className="persona-card-title">{p.label}</h3>
                <p className="persona-card-sub">{p.subtitle}</p>
                <p className="persona-card-desc">{p.description}</p>

                {/* Features */}
                <div className="persona-features">
                  {p.features.map(f => (
                    <span key={f} className="persona-feature-tag">{f}</span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className={`persona-cta bg-gradient-to-r ${p.gradient}`}>
                {loading && selected === p.role ? (
                  <span className="loading-dots">Loading</span>
                ) : (
                  <>Enter as {p.label} →</>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          className="persona-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          No authentication required · Role-based demo experience
        </motion.p>
      </div>

      {/* Company Picker Modal */}
      <AnimatePresence>
        {showCompanyPicker && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowCompanyPicker(false); setSelected(null); }}
          >
            <motion.div
              className="company-picker"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="picker-title">Select Company</h2>
              <p className="picker-subtitle">Choose which company to manage</p>

              <div className="company-list">
                {companies.map(c => (
                  <button
                    key={c.company_id}
                    className="company-item"
                    onClick={() => handleCompanySelect(c)}
                  >
                    <span className="company-icon">🏢</span>
                    <span className="company-name">{c.company_name}</span>
                    <span className="company-arrow">→</span>
                  </button>
                ))}
              </div>

              <div className="company-create">
                <p className="create-label">Or create a new company</p>
                <div className="create-row">
                  <input
                    className="create-input"
                    placeholder="Company name..."
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCompany()}
                  />
                  <button
                    className="create-btn"
                    onClick={handleCreateCompany}
                    disabled={!newCompanyName.trim() || loading}
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
