export type UserRole = 'admin' | 'end_user' | 'developer';

export interface Persona {
  role: UserRole;
  name: string;
  email: string;
  company_id?: string;
  company_name?: string;
}
export interface User {
  user_id: string;
  company_id?: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Company {
  company_id: string;
  company_name: string;
  created_at: string;
  settings: Record<string, any>;
}

export interface MarketplaceAgent {
  agent_id: string;
  agent_name: string;
  version: string;
  capabilities: string[];
  description: string;
  provider: string;
  input_type: string;
  output_type: string;
  api_endpoint?: string;
  health_check_endpoint?: string;
  pricing_model: 'free' | 'pay_per_call' | 'subscription';
  quality_score?: number;
  created_at: string;
  updated_at: string;
  is_available: boolean;
  changelog?: string;
}

export interface CompanyAgent {
  id: string;
  company_id: string;
  agent_id: string;
  added_at: string;
  status: 'active' | 'deprecated' | 'updating' | 'failed';
  auto_update_enabled: boolean;
  quality_score: number;
  execution_count: number;
  last_used_at?: string;
  total_execution_time: number;
  total_cost: number;
  settings: Record<string, any>;
  agents_marketplace?: MarketplaceAgent;
}

export interface SubTask {
  step: number;
  intent: string;
  required_capability: string;
  parameters: Record<string, any>;
}

export interface Intent {
  intent: string;
  task_type: string;
  required_capability: string;
  parameters: Record<string, any>;
  original_request: string;
  confidence: number;
  sub_tasks: SubTask[];
  is_multi_agent: boolean;
}

export interface WorkflowStep {
  step: number;
  capability: string;
  status: 'available' | 'missing';
  agent?: MarketplaceAgent;
  marketplace_options: MarketplaceAgent[];
}

export interface RoutingDecision {
  selected_agent?: MarketplaceAgent;
  alternatives: MarketplaceAgent[];
  is_multi_agent: boolean;
  workflow_steps: WorkflowStep[];
  missing_capabilities: string[];
  routing_reason: string;
}

export interface ExecutionResult {
  execution_id: string;
  success: boolean;
  result?: { output: string; format: string };
  agents_used: string[];
  execution_time: number;
  tokens_used: number;
  quality_score: number;
  error?: string;
  routing?: RoutingDecision;
}

export interface MarketplaceUpdate {
  current_agent_id: string;
  current_version: string;
  new_agent: MarketplaceAgent;
  agent_name: string;
  auto_update: boolean;
}

export interface Credential {
  credential_id: string;
  api_key?: string; // Only during generation
  api_key_masked: string; // e.g., "sk_live_****...F2Sa"
  secret_key?: string; // Only during generation
  expiry_date: string;
  rotation_status: 'active' | 'rotated' | 'revoked';
  created_at: string;
  rotated_at?: string;
  days_until_expiry: number;
}

export interface CredentialGenerateRequest {
  agent_id: string;
}

export interface CredentialResponse {
  success: boolean;
  credential?: Credential;
  message?: string;
}
