import axios from 'axios';
import type { 
  MarketplaceAgent, CompanyAgent, Intent, ExecutionResult, 
  MarketplaceUpdate, Company, User
} from '../types';


const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE, timeout: 120000 });

// ── Intent ────────────────────────────────────────────────────────────────────
export const parseIntent = async (request: string) => {
  const { data } = await api.post('/api/intent/parse', { request });
  return data as { success: boolean; intent?: Intent; error?: string; suggestions?: string[] };
};

// ── Agent Execution ───────────────────────────────────────────────────────────
export const executeAgent = async (intent: Intent, company_id: string, user_id?: string) => {
  const { data } = await api.post('/api/agent/execute', { intent, company_id, user_id });
  return data as ExecutionResult;
};

// ── Marketplace ───────────────────────────────────────────────────────────────
export const getMarketplaceAgents = async (capability?: string) => {
  const { data } = await api.get('/api/marketplace/agents', {
    params: capability ? { capability } : {},
  });
  return data as { agents: MarketplaceAgent[]; total: number };
};

export const getMarketplaceCapabilities = async () => {
  const { data } = await api.get('/api/marketplace/capabilities');
  return data as { capabilities: string[] };
};

export const registerAgent = async (payload: Record<string, any>) => {
  const { data } = await api.post('/api/marketplace/register', payload);
  return data;
};

// ── Company ───────────────────────────────────────────────────────────────────
export const getAllCompanies = async () => {
  const { data } = await api.get('/api/company/all');
  return data as { companies: Company[] };
};

export const createCompany = async (name: string) => {
  const { data } = await api.post('/api/company', { company_name: name });
  return data as { success: boolean; company: Company };
};

export const getCompanyAgents = async (company_id: string) => {
  const { data } = await api.get(`/api/company/${company_id}/agents`);
  return data as { agents: CompanyAgent[]; company_id: string };
};

export const addAgentToCompany = async (company_id: string, agent_id: string, auto_update = true) => {
  const { data } = await api.post(`/api/company/${company_id}/agents`, { agent_id, auto_update_enabled: auto_update });
  return data;
};

export const updateAgentSettings = async (company_id: string, agent_id: string, settings: Record<string, any>) => {
  const { data } = await api.patch(`/api/company/${company_id}/agents/${agent_id}`, settings);
  return data;
};

export const removeAgent = async (company_id: string, agent_id: string) => {
  const { data } = await api.delete(`/api/company/${company_id}/agents/${agent_id}`);
  return data;
};

export const getCompanyUpdates = async (company_id: string) => {
  const { data } = await api.get(`/api/company/${company_id}/updates`);
  return data as { upgrades: MarketplaceUpdate[]; new_agents: any[] };
};

export const applyCompanyUpdates = async (companyId: string): Promise<any> => {
  const { data } = await api.post(`/company/${companyId}/updates/apply`);
  return data;
};

export const upgradeAgent = async (companyId: string, agentId: string, newAgentId: string): Promise<any> => {
  const { data } = await api.post(`/company/${companyId}/agents/${agentId}/upgrade`, null, {
    params: { new_agent_id: newAgentId }
  });
  return data;
};

export const getCompanyUsers = async (companyId: string): Promise<{ users: User[] }> => {
  const { data } = await api.get(`/api/company/${companyId}/users`);
  return data;
};

export const getCompanyStats = async (company_id: string) => {
  const { data } = await api.get(`/api/company/${company_id}/stats`);
  return data;
};

export const getAdminMetrics = async (company_id: string, agent_id?: string) => {
  const { data } = await api.get('/api/admin/metrics', {
    params: { company_id, ...(agent_id ? { agent_id } : {}) },
  });
  return data;
};
