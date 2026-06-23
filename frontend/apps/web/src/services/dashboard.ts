import { API_BASE_URL } from "./config";
import type { DashboardSummary, PurchaseTrendResponse, RecentActivityResponse } from "../types";

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

  async getPurchaseTrend(accessToken: string, days = 30): Promise<PurchaseTrendResponse> {
    const response = await fetch(`${API_BASE_URL}/dashboard/purchase-trend?days=${days}`, {
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
