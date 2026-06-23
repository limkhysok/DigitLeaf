import { API_BASE_URL } from "./config";
import type { DashboardSummary, PurchaseTrendParams, PurchaseTrendResponse, RecentActivityResponse } from "../types";

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

  async getRecentActivity(accessToken: string, limit = 10): Promise<RecentActivityResponse> {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity?limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch recent activity");
    }
    return response.json();
  },
};
