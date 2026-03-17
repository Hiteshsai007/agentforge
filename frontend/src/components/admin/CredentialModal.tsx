import { useState, useEffect, useCallback } from 'react';
import type { CompanyAgent, Credential } from '../../types';
import { getCredentialsStatus, updateQualityPrivacy } from '../../api/client';
import OTPCredentialModal from '../user/OTPCredentialModal';
import toast from 'react-hot-toast';

interface Props {
  agent: CompanyAgent;
  companyId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CredentialModal({ agent, companyId, userEmail, isOpen, onClose, onUpdate }: Props) {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(false);
  const [qualityPrivacy, setQualityPrivacy] = useState<'private' | 'public'>(
    agent.settings?.quality_privacy || 'private'
  );
  
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
    if (isOpen) {
      fetchCredentialStatus();
    }
  }, [isOpen, fetchCredentialStatus]);

  const handleOTPSuccess = () => {
    fetchCredentialStatus();
    onUpdate();
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-primary)] rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header Glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="relative z-10 p-8 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                    🔑
                  </span>
                  API Credentials
                </h2>
                <p className="text-sm text-gray-400 mt-2">Manage authentication keys for <span className="text-indigo-300">{mp.agent_name}</span></p>
              </div>
              <span className={`text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border ${
                credential 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {credential ? '✓ Generated' : '○ Not Generated'}
              </span>
            </div>

            {/* Credentials Display or Empty State */}
            {credential ? (
              <div className="space-y-6">
                {/* API Key */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      API Key
                    </label>
                    <span className="text-xs text-gray-500">Use in header: X-API-Key</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm bg-black/40 px-4 py-3 rounded-lg font-mono text-gray-200 overflow-x-auto border border-white/5">
                      {credential.api_key_masked}
                    </code>
                    <button
                      onClick={() => copyToClipboard(credential.api_key_masked, 'API Key')}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Copy API Key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowOTPModal(true)}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      title="Regenerate API Key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className={`border rounded-xl p-5 ${getExpiryBgColor(credential.days_until_expiry)}`}>
                  <label className="text-sm font-semibold uppercase tracking-wider text-gray-400 block mb-3">
                    Expiry Date
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-mono font-bold ${getExpiryColor(credential.days_until_expiry)}`}>
                        {new Date(credential.expiry_date).toLocaleDateString()}
                      </p>
                      <p className={`text-sm mt-1 ${getExpiryColor(credential.days_until_expiry)}`}>
                        {credential.days_until_expiry} days remaining
                      </p>
                    </div>
                    {credential.days_until_expiry <= 30 && (
                      <span className="text-4xl">⏰</span>
                    )}
                  </div>
                </div>

                {/* Credential Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Status</p>
                    <p className="text-gray-200 font-medium capitalize">{credential.rotation_status}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Created</p>
                    <p className="text-gray-200 font-medium">{new Date(credential.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 border border-dashed border-white/20 rounded-2xl mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <span className="text-3xl">🔐</span>
                </div>
                <p className="text-gray-300 text-lg font-medium mb-2">No credentials generated yet</p>
                <p className="text-gray-500 text-sm mb-6">Generate API credentials to enable integrations for this agent</p>
                <button
                  onClick={() => setShowOTPModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  🔑 Generate Credentials
                </button>
              </div>
            )}

            {/* Quality Privacy Toggle */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-200">Quality Scoring</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {qualityPrivacy === 'private'
                      ? '🔒 Private: Quality scored within company only'
                      : '🌐 Public: Quality scores count toward global marketplace ranking'}
                  </p>
                </div>
                <button
                  onClick={handleQualityPrivacyToggle}
                  disabled={loading}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
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
            {credential && (
              <div className="flex gap-3 mt-6 pt-4">
                <button
                  onClick={() => setShowOTPModal(true)}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Sending...' : 'Regenerate Credentials'}
                </button>
                <button
                  onClick={fetchCredentialStatus}
                  disabled={loading}
                  className="px-5 py-3 bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
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
    </>
  );
}
