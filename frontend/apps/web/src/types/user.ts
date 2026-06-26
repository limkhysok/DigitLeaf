export interface UserProfile {
  id: number;
  user_name: string;
  access_type: string;
  login_type: string;
  region: number | null;
  do_date: string | null;
}

export interface UserCreate {
  user_name: string;
  password: string;
  access_type: string;
  login_type: string;
}
