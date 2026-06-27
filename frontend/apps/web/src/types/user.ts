export interface UserProfile {
  id: number;
  user_name: string;
  access_type: string;
  login_type: string;
  regions: number[];
  do_date: string | null;
  role_id: number | null;
  role_name: string | null;
}

export interface UserCreate {
  user_name: string;
  password: string;
  access_type: string;
  login_type: string;
  regions: number[];
}

export interface RoleItem {
  id: number;
  name: string;
  description?: string | null;
}
