export interface TodayPurchasesSummary {
  count: number;
  net_weight_kg: number;
  grand_total: number;
}

export interface SackRegistrationStatsSummary {
  registration_counts: { total: number; today: number };
  sack_weight_kg: { total: number; today: number };
}

export interface OutstandingRepaySummary {
  year: number;
  today_repaid_kg: number;
  today_repay_pct: number;
  total_contracted: number;
  total_repaid: number;
  outstanding: number;
}

export interface FarmerContractsSummary {
  year: number;
  count: number;
  total_land: number;
  total_tobac_num: number;
  prev_year_count: number;
  yoy_change_pct: number;
}

export interface DashboardSummary {
  today_purchases: TodayPurchasesSummary;
  sack_registration: SackRegistrationStatsSummary;
  outstanding_repay: OutstandingRepaySummary;
  farmer_contracts: FarmerContractsSummary;
}

export type TrendPreset = "7d" | "30d" | "3m" | "9m" | "12m" | "custom";
export type TrendGranularity = "daily" | "weekly" | "monthly";

export interface PurchaseTrendPoint {
  date: string;
  net_weight_kg: number;
  repay_weight_kg: number;
}

export interface PurchaseTrendResponse {
  points: PurchaseTrendPoint[];
  granularity: TrendGranularity;
  start_date: string;
  end_date: string;
}

export interface PurchaseTrendParams {
  preset: TrendPreset;
  startDate?: string;
  endDate?: string;
}

export interface RecentActivityItem {
  type: "purchase" | "repay";
  id: number;
  date: string;
  reference: string;
  name: string;
  qty_kg: number;
}

export interface RecentActivityResponse {
  items: RecentActivityItem[];
}
