import { useState, useEffect } from 'react';
import { generateCompanyAPIKey, revokeCompanyAPIKey, getCompanyAPIKeyStatus, getAvailableUpgrades } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
}

interface Upgrade {
  current_agent_id: string;
  current_version: string;
  new_agent_id: string;
  new_agent_name: string;
  new_version: string;
  changelog: string | null;
  auto_update_enabled: boolean;
}

export default function CompanyAPISettings({ companyId }: Props) {
  const [keyStatus, setKeyStatus] = useState<{ api_key_status: string; api_key_expiry_date: string | null; has_active_key: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loadingUpgrades, setLoadingUpgrades] = useState(true);

  const fetchKeyStatus = async () => {
    try {
      const status = await getCompanyAPIKeyStatus(companyId);
      setKeyStatus(status);
    } catch (e) {
      console.error('Failed to fetch key status', e);
    }
  };

  const fetchUpgrades = async () => {
    try {
      const data = await getAvailableUpgrades(companyId);
      setUpgrades(data.upgrades || []);
    } catch (e) {
      console.error('Failed to fetch upgrades', e);
    } finally {
      setLoadingUpgrades(false);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
    fetchUpgrades();
  }, [companyId]);

  const handleGenerateKey = async () => {
    setLoading(true);
    setGeneratedKey(null);
    try {
      const result = await generateCompanyAPIKey(companyId, true);
      if (result.success) {
        toast.success('Company API key generated and sent to your email!');
        setGeneratedKey(result.api_key || null);
        fetchKeyStatus();
      } else {
        toast.error(result.message || 'Failed to generate API key');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!confirm('Are you sure you want to revoke this API key? Any applications using it will stop working.')) return;
    
    setLoading(true);
    try {
      const result = await revokeCompanyAPIKey(companyId);
      if (result.success) {
        toast.success('API key revoked');
        fetchKeyStatus();
      } else {
        toast.error(result.message || 'Failed to revoke API key');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to revoke API key');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Company API Key Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                🔑
              </span>
              Company API Key
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Use this single API key to access all agents in your company portfolio
            </p>
          </div>
          <span className={`text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border ${
            keyStatus?.has_active_key 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          }`}>
            {keyStatus?.has_active_key ? '✓ Active' : '○ Not Generated'}
          </span>
        </div>

        {/* Key Status */}
        {keyStatus?.has_active_key && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Status</p>
                <p className="text-gray-200 capitalize">{keyStatus.api_key_status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Expires</p>
                <p className="text-gray-200">{formatDate(keyStatus.api_key_expiry_date)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Key Display */}
        {generatedKey && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-emerald-400 mb-2">⚠️ Save this key now - it won't be shown again!</p>
            <code className="block text-sm bg-black/40 px-4 py-3 rounded-lg font-mono text-emerald-300 break-all">
              {generatedKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(generatedKey)}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerateKey}
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {loading ? 'Generating...' : keyStatus?.has_active_key ? 'Regenerate Key' : 'Generate API Key'}
          </button>
          
          {keyStatus?.has_active_key && (
            <button
              onClick={handleRevokeKey}
              disabled={loading}
              className="px-5 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Revoke Key
            </button>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">How to use:</h3>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-gray-400 space-y-2">
            <p><span className="text-indigo-400"># Auto-route to best agent:</span></p>
            <p>curl -X POST https://api.agentforge.com/agent/execute \</p>
            <p>&nbsp;&nbsp;-H "X-Company-API-Key: sk_company_xxxxx" \</p>
            <p>&nbsp;&nbsp;-d '{"task": "summarize this", "company_id": "..."}'</p>
            <p className="mt-3"><span className="text-indigo-400"># Use specific agent:</span></p>
            <p>curl -X POST https://api.agentforge.com/agent/execute \</p>
            <p>&nbsp;&nbsp;-H "X-Company-API-Key: sk_company_xxxxx" \</p>
            <p>&nbsp;&nbsp;-H "X-Agent-ID: agent_uuid" \</p>
            <p>&nbsp;&nbsp;-d '{"task": "summarize this", "company_id": "..."}'</p>
          </div>
        </div>
      </div>

      {/* Available Upgrades Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg">
                🔄
              </span>
              Available Upgrades
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Newer agents available in the marketplace
            </p>
          </div>
          {upgrades.length > 0 && (
            <span className="text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30">
              {upgrades.length} Update{upgrades.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingUpgrades ? (
          <div className="text-gray-400">Loading...</div>
        ) : upgrades.length === 0 ? (
          <div className="text-center py-8 bg-white/5 border border-dashed border-white/20 rounded-xl">
            <p className="text-gray-400">No upgrades available</p>
            <p className="text-sm text-gray-500 mt-1">Your agents are up to date!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upgrades.map((upgrade, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{upgrade.new_agent_name}</p>
                    <p className="text-sm text-gray-400">
                      v{upgrade.current_version} → v{upgrade.new_version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {upgrade.auto_update_enabled ? (
                      <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                        Auto-enabled
                      </span>
                    ) : (
                      <button className="text-xs px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 hover:bg-indigo-500/30">
                        Enable Auto-update
                      </button>
                    )}
                  </div>
                </div>
                {upgrade.changelog && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-500">{upgrade.changelog}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
