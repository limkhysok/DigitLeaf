export interface TobaccoRepayItem {
  id: number | null;
  contract_number: string | null;
  contract_contractor_name: string | null;
  representative: string | null;
  contract_year: number | null;
  mf_con_id: number | null;
  f_id: number | null;
  farmer_name: string | null;
  tobacco_type: string | null;
  Quantity: number | null;
  total_repaid: number | null;
}

export interface TobaccoRepayListResponse {
  items: TobaccoRepayItem[];
  total: number;
  has_more: boolean;
}

export interface RepayHistoryItem {
  repay_id: number;
  repay_date: string | null;
  repay_num: string | null;
  con_num: string | null;
  farmer_name: string | null;
  tobacco_type: string | null;
  qty_repay: number | null;
  note: string | null;
  user: string | null;
  contract_year: number | null;
}

export interface RepayHistoryListResponse {
  items: RepayHistoryItem[];
  total: number;
  has_more: boolean;
}

export interface ConTobaccoItem {
  t_id: number;
  tobacco: string | null;
}

export interface TContractCreate {
  con_num?: string;
  contractor: string;
  f_id: number;
  tobac_type: number;
  qty: number;
  price: number;
  con_date: string;
  rate?: number;
  year?: number;
  represent?: string;
  note?: string;
}

export interface TContractRead {
  con_id: number | null;
  con_num: string | null;
  contractor: string | null;
  f_id: number | null;
  tobac_type: number | null;
  qty: number | null;
  price: number | null;
  rate: number | null;
  year: number | null;
  represent: string | null;
  con_date: string | null;
  note: string | null;
  user: string | null;
  do_date: string | null;
}
