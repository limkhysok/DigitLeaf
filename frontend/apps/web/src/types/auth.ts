export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
}

export interface AuditLog {
  id: number;
  page_name: string | null;
  field_type: string | null;
  old_value: string | null;
  new_value: string | null;
  user: string | null;
  action: string | null;
  log_on: string | null;
  ip_address: string | null;
  date: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  has_more: boolean;
}
