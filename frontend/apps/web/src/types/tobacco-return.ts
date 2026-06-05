export interface TobaccoReturnItem {
  id: number | null;
  contract_number: string | null;
  contract_contractor_name: string | null;
  representative: string | null;
  contract_year: number | null;
  mf_con_id: number | null;
  tobacco_type: string | null;
  Quantity: number | null;
  total_repaid: number | null;
}

export interface TobaccoReturnListResponse {
  items: TobaccoReturnItem[];
  total: number;
}
