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
