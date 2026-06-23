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
  contract_count: number;
  total_contracted: number;
  total_repaid: number;
  outstanding: number;
}

export interface FarmerContractsSummary {
  year: number;
  count: number;
  total_land: number;
  total_tobac_num: number;
}

export interface DashboardSummary {
  today_purchases: TodayPurchasesSummary;
  sack_registration: SackRegistrationStatsSummary;
  outstanding_repay: OutstandingRepaySummary;
  farmer_contracts: FarmerContractsSummary;
}

export interface PurchaseTrendPoint {
  date: string;
  net_weight_kg: number;
}

export interface PurchaseTrendResponse {
  points: PurchaseTrendPoint[];
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
