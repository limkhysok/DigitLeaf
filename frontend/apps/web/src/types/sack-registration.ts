export interface RepresentItem {
  represent_id: number;
  represent_name: string;
  farmer_count: number;
}

export interface MemberFarmerItem {
  mf_id: number;
  name: string;
  mf_code: string;
  address?: string;
  tobac_num?: number;
  purchased_weight?: number;
}

export interface SackRegistrationItem {
  id: number;
  represent_id: number;
  represent_name: string;
  member_farmer_id: number;
  member_farmer_name: string;
  member_farmer_mf_code: string;
  dl_user_id: number;
  dl_user_name: string;
  sack_in_kg: number | null;
  notes: string | null;
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export interface SackRegistrationCreate {
  represent_id: number;
  member_farmer_name?: string;
  member_farmer_identity_card?: string;
  sack_in_kg?: number;
  notes?: string;
  registered_at?: string;
}

export interface SackRegistrationUpdate {
  member_farmer_identity_card?: string;
  sack_in_kg?: number | null;
  notes?: string;
}

export interface SackRegistrationListParams {
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  status?: "pending" | "confirmed";
}

export interface SackRegistrationListResponse {
  items: SackRegistrationItem[];
  total: number;
  has_more: boolean;
}

export interface FarmerContractItem {
  mf_con_id: number;
  mf_id: number;
  year: number;
  name: string;
  mf_code: string;
  t_id?: number | null;
  land?: number | null;
  tobac_num?: number | null;
  expected_yield?: number | null;
  purchased_weight?: number | null;
  do_date?: string | null;
}

export interface FarmerContractListResponse {
  items: FarmerContractItem[];
  total: number;
  has_more: boolean;
}

export interface FarmerContractFormMetadata {
  tobacco_types: { t_id: number; t_name: string; t_name_kh?: string }[];
}

export interface FarmerContractCreate {
  mf_id: number;
  t_id: number;
  year: number;
  land?: number | null;
  tobac_num?: number | null;
}

export interface FarmerContractCreated {
  mf_con_id: number;
  mf_id: number;
  year: number;
  land?: number | null;
  tobac_num?: number | null;
}

export interface FarmerContractUpdate {
  mf_id: number;
  t_id: number;
  year: number;
  land?: number | null;
  tobac_num?: number | null;
}

export interface FarmerContractPatch {
  mf_id?: number;
  t_id?: number;
  year?: number;
  land?: number | null;
  tobac_num?: number | null;
}
