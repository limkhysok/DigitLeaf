export interface UserProfile {
  id: number;
  user_name: string;
  role: { name: string } | null;
  totp_enabled: boolean;
  created_at: string;
}

export interface UserCreate {
  user_name: string;
  password: string;
  role_name: string;
}

export interface UserChangePassword {
  current_password: string;
  new_password: string;
}

export interface UserAdminResetPassword {
  new_password: string;
}
