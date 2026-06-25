export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
}

export interface UserSession {
  id: number;
  user_name: string;
  refresh_token: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  endpoint: string;
  method: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
