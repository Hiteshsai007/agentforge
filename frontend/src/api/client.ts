import axios from 'axios';
import type { 
  MarketplaceAgent, CompanyAgent, Intent, ExecutionResult, 
  MarketplaceUpdate, Company, User
} from '../types';


const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE, timeout: 120000 });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// ── Credentials ───────────────────────────────────────────────────────────────
export const generateCredentials = async (company_id: string, agent_id: string) => {
  const { data } = await api.post(
    `/api/company/${company_id}/agents/${agent_id}/generate-credentials`,
    {}
  );
  return data;
};

export const getCredentialsStatus = async (company_id: string, agent_id: string) => {
  const { data } = await api.get(
    `/api/company/${company_id}/agents/${agent_id}/credentials-status`
  );
  return data;
};

export const rotateCredentials = async (company_id: string, agent_id: string) => {
  const { data } = await api.post(
    `/api/company/${company_id}/agents/${agent_id}/rotate-credentials`,
    {}
  );
  return data;
};

export const regenerateWithEmail = async (email: string, company_id: string, agent_id: string) => {
  const { data } = await api.post(
    `/api/credentials/regenerate-with-email`,
    { email, company_id, agent_id }
  );
  return data;
};

export const updateQualityPrivacy = async (
  company_id: string,
  agent_id: string,
  quality_privacy: 'private' | 'public'
) => {
  const { data } = await api.patch(
    `/api/company/${company_id}/agents/${agent_id}`,
    { settings: { quality_privacy } }
  );
  return data;
};

// ── OTP Credentials ─────────────────────────────────────────────────────────────
export const requestOTP = async (email: string, company_id: string, agent_id: string) => {
  const { data } = await api.post('/api/credentials/request-otp', {
    email,
    company_id,
    agent_id,
  });
  return data as { success: boolean; message: string; expires_in: number };
};

export const verifyOTP = async (
  email: string,
  otp_code: string,
  company_id: string,
  agent_id: string
) => {
  const { data } = await api.post('/api/credentials/verify-otp', {
    email,
    otp_code,
    company_id,
    agent_id,
  });
  return data as { success: boolean; message: string };
};

export const resendOTP = async (email: string, company_id: string, agent_id: string) => {
  const { data } = await api.post('/api/credentials/resend-otp', {
    email,
    company_id,
    agent_id,
  });
  return data as { success: boolean; message: string; expires_in: number };
};

// ── Company Invite Code ─────────────────────────────────────────────────────────
export const getInviteCode = async () => {
  const { data } = await api.get('/api/auth/company/invite-code');
  return data as { company_id: string; company_name: string; invite_code: string };
};
