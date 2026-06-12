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
  dl_user_id: number;
  dl_user_name: string;
  status: number;
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
  status?: number;
  sack_in_kg?: number;
  notes?: string;
  registered_at?: string;
}

export interface SackRegistrationUpdate {
  member_farmer_identity_card?: string;
  status?: number;
  sack_in_kg?: number | null;
  notes?: string;
}

export interface SackRegistrationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  date_from?: string;
  date_to?: string;
  sort_sack_in_kg?: string | null;
}

export interface SackRegistrationListResponse {
  items: SackRegistrationItem[];
  total: number;
  has_more: boolean;
}

export interface SackStatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface SackStatusCountsParams {
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface SackRegistrationStats {
  registration_counts: {
    total: number
    today: number
  }
  status_breakdown: {
    approved: number
    approved_today: number
    pending: number
    pending_today: number
  }
  sack_weight_kg: {
    pending: number
    pending_today: number
  }
}

export interface FarmerContractItem {
  mf_con_id: number;
  mf_id: number;
  year: number;
  name: string;
  mf_code: string;
  land?: number | null;
  tobac_num?: number | null;
  expected_yield?: number | null;
  purchased_weight?: number | null;
}

export interface FarmerContractListResponse {
  items: FarmerContractItem[];
  total: number;
  has_more: boolean;
}
