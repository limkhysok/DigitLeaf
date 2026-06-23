import { API_BASE_URL } from "./config";
import type { DashboardSummary, PurchaseTrendParams, PurchaseTrendResponse, PurchaseByBuyerResponse } from "../types";

export const dashboardApi = {
  async getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch dashboard summary");
    }
    return response.json();
  },

  async getPurchaseTrend(
    accessToken: string,
    trendParams?: PurchaseTrendParams
  ): Promise<PurchaseTrendResponse> {
    const { preset, startDate, endDate } = trendParams ?? { preset: "7d" as const };
    const params = new URLSearchParams({ preset });
    if (preset === "custom" && startDate && endDate) {
      params.set("start_date", startDate);
      params.set("end_date", endDate);
    }
    const response = await fetch(`${API_BASE_URL}/dashboard/purchase-trend?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch purchase trend");
    }
    return response.json();
  },

  async getPurchaseByBuyer(accessToken: string, year?: number): Promise<PurchaseByBuyerResponse> {
    const params = year ? `?year=${year}` : "";
    const response = await fetch(`${API_BASE_URL}/dashboard/purchase-by-buyer${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch purchase by buyer");
    }
    return response.json();
  },
};
