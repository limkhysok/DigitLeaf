export interface PurchaserItem {
  p_id: number;
  p_name: string;
  p_name_kh?: string;
  region?: number;
}

export interface RegionItem {
  reg_id: number;
  reg_name: string;
  reg_name_kh?: string;
}

export interface OvenItem {
  id: number;
  name_en: string;
  name_kh?: string;
}

export interface TobaccoItem {
  t_id: number;
  t_name: string;
  t_name_kh?: string;
}

export interface TobaccoPurchaseDetail {
  tpd_id?: number;
  invoice_num?: string;
  tobacco_name: number;
  gross_weight?: number | null;
  price: number;
  remork_in_kg?: number;
  sack_in_kg?: number | null;
  farmer_own_sack?: number;
  total_amount?: number;
  CreatedDate?: string;
  closing?: string;
  buyer?: number;
  oven?: number;
  region?: number;
  picture?: string | null;
}

export interface TobaccoPurchase {
  tp_id: number;
  invoice_num: string;
  buyer: number | null;
  vendor_id: number | string | null;
  vendor_name: string | null;
  v_addr: string | null;
  region: number | null;
  tp_date: string;
  tp_note: string | null;
  user: string | null;
  closing: string | null;
  oven: number | null;
  rate: number;
  do_date?: string;
  tobacco_item_count?: number | null;
  total_net_weight?: number | null;
  grand_total?: number | null;
  details?: TobaccoPurchaseDetail[];
  returns?: TobaccoReturnCreate[];
}

export interface TobaccoReturnCreate {
  con_id: number;
  tobac_type: number;
  qty_repay: number;
}

export interface VendorContractItem {
  con_id: number;
  con_num: string;
  contractor?: string;
  tobac_type?: number;
  t_name?: string;
  t_name_kh?: string;
  qty?: number;
  total_returned?: number;
}

export interface TobaccoPurchaseCreate {
  buyer?: number;
  vendor_id?: number | string;
  v_addr?: string;
  region?: number;
  tp_date: string;
  tp_note?: string;
  closing?: string;
  oven?: number;
  rate: number;
  details: TobaccoPurchaseDetail[];
  returns?: TobaccoReturnCreate[];
}

export interface TobaccoPurchaseListResponse {
  items: TobaccoPurchase[];
  total: number;
  has_more: boolean;
}

export interface TobaccoPurchaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  buyer?: number | null;
  region?: number | null;
  oven?: number | null;
  sort_grand_total?: string | null;
  sort_net_weight?: string | null;
}

export interface TobaccoPurchaseFormMetadata {
  purchasers: PurchaserItem[];
  regions: RegionItem[];
  ovens: OvenItem[];
  tobacco_types: TobaccoItem[];
}
