import { useState, useEffect, useCallback } from 'react';
import type { CompanyAgent, Credential } from '../../types';
import { generateCredentials, getCredentialsStatus, rotateCredentials, updateQualityPrivacy } from '../../api/client';
import OTPCredentialModal from '../user/OTPCredentialModal';
import toast from 'react-hot-toast';

interface Props {
  agent: CompanyAgent;
  companyId: string;
  userEmail: string;
  onUpdate: () => void;
}

export default function CredentialDashboard({ agent, companyId, userEmail, onUpdate }: Props) {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [qualityPrivacy, setQualityPrivacy] = useState<'private' | 'public'>(
    agent.settings?.quality_privacy || 'private'
  );
  
  // OTP Modal state
  const [showOTPModal, setShowOTPModal] = useState(false);

  const mp = agent.agents_marketplace || { agent_name: 'Unknown Agent' };

  const fetchCredentialStatus = useCallback(async () => {
    try {
      const res = await getCredentialsStatus(companyId, agent.agent_id);
      if (res.credential) {
        setCredential(res.credential);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (!error?.response?.status || error.response?.status !== 404) {
        console.error('Failed to fetch credential status', err);
      }
    }
  }, [companyId, agent.agent_id]);

  useEffect(() => {
    fetchCredentialStatus();
  }, [fetchCredentialStatus]);

  const handleGenerate = async () => {
    setShowOTPModal(true);
  };

  const handleRegenerate = async () => {
    setShowOTPModal(true);
  };

  const handleOTPSuccess = () => {
    fetchCredentialStatus();
  };

  const handleQualityPrivacyToggle = async () => {
    const newValue = qualityPrivacy === 'private' ? 'public' : 'private';
    setLoading(true);
    try {
      await updateQualityPrivacy(companyId, agent.agent_id, newValue);
      setQualityPrivacy(newValue);
      toast.success(`Quality scoring set to ${newValue}`);
    } catch (err) {
      console.error('Failed to update quality privacy:', err);
      toast.error('Failed to update quality privacy');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getExpiryColor = (days: number) => {
    if (days > 30) return 'text-emerald-400';
    if (days > 7) return 'text-amber-400';
    return 'text-red-400';
  };

  const getExpiryBgColor = (days: number) => {
    if (days > 30) return 'bg-emerald-500/10 border-emerald-500/30';
    if (days > 7) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">API Credentials</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage authentication keys for integrations</p>
        </div>
        <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded border ${
          credential ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
        }`}>
          {credential ? 'Generated' : 'Not Generated'}
        </span>
      </div>

      {/* Credentials Display or Empty State */}
      {credential ? (
        <div className="space-y-4">
          {/* API Key */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
              API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-black/30 px-3 py-2 rounded font-mono text-gray-300 overflow-x-auto">
                {credential.api_key_masked}
              </code>
              <button
                onClick={() => copyToClipboard(credential.api_key_masked, 'API Key')}
                className="p-2 hover:bg-white/10 rounded transition-colors text-lg"
                title="Copy API Key"
              >
                📋
              </button>
              <button
                onClick={handleRegenerate}
                className="p-2 hover:bg-white/10 rounded transition-colors text-lg"
                title="Regenerate API Key"
              >
                🔄
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Use in header: <code className="bg-black/30 px-1 rounded">X-API-Key: {credential.api_key_masked}</code></p>
            <p className="text-xs text-amber-400 mt-1">Lost your API key? Click 🔄 to regenerate.</p>
          </div>

          {/* Secret Key Display Modal */}
          {showSecret && generatedSecret && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 relative">
              <button
                onClick={() => { setShowSecret(false); setGeneratedSecret(null); }}
                className="absolute top-3 right-3 text-lg hover:opacity-70"
              >
                ✕
              </button>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">⚠️ Secret Key (Save Now!)</p>
                <p className="text-sm text-amber-200 mb-3">This is your only chance to see the secret key. Store it safely—you'll need it for API authentication.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-black/50 px-3 py-2 rounded font-mono text-amber-300 overflow-x-auto break-all">
                    {generatedSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedSecret, 'Secret Key')}
                    className="p-2 hover:bg-white/10 rounded transition-colors text-lg whitespace-nowrap"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expiry Date */}
          <div className={`border rounded-lg p-4 bg-white/5 ${getExpiryBgColor(credential.days_until_expiry)}`}>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
              Expiry Date
            </label>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-mono ${getExpiryColor(credential.days_until_expiry)}`}>
                  {new Date(credential.expiry_date).toLocaleDateString()}
                </p>
                <p className={`text-sm mt-1 ${getExpiryColor(credential.days_until_expiry)}`}>
                  {credential.days_until_expiry} days remaining
                </p>
              </div>
              {credential.days_until_expiry <= 30 && (
                <span className="text-2xl">⏰</span>
              )}
            </div>
          </div>

          {/* Credential Status */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 border border-white/10 rounded p-3">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Status</p>
              <p className="text-gray-200 font-mono capitalize">{credential.rotation_status}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded p-3">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Created</p>
              <p className="text-gray-200 font-mono">{new Date(credential.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white/5 border border-dashed border-white/20 rounded-lg">
          <p className="text-gray-400 text-sm mb-4">No credentials generated yet</p>
          <p className="text-xs text-gray-500 mb-4">Generate API credentials to enable integrations</p>
        </div>
      )}

      {/* Quality Privacy Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-300">Quality Scoring</p>
            <p className="text-xs text-gray-500 mt-1">
              {qualityPrivacy === 'private'
                ? 'Private: Quality scored within company only'
                : 'Public: Quality scores count toward global marketplace ranking'}
            </p>
          </div>
          <button
            onClick={handleQualityPrivacyToggle}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              qualityPrivacy === 'public'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {qualityPrivacy === 'private' ? '🔒 Private' : '🌐 Public'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {!credential ? (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 primary-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Generating...' : '🔑 Generate Credentials'}
          </button>
        ) : (
          <>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Sending...' : '🔄 Regenerate Credentials'}
            </button>
            <button
              onClick={fetchCredentialStatus}
              disabled={loading}
              className="px-4 py-2 bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Refresh
            </button>
          </>
        )}
      </div>

      {/* OTP Credential Modal */}
      {showOTPModal && (
        <OTPCredentialModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          email={userEmail}
          companyId={companyId}
          agentId={agent.agent_id}
          agentName={mp.agent_name}
          onSuccess={handleOTPSuccess}
        />
      )}
    </div>
  );
}
