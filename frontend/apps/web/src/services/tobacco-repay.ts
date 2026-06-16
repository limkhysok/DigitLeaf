import { TobaccoRepayListResponse, VendorContractItem } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api/v1";

export const tobaccoRepayApi = {
  getTobaccoRepays: async (
    token: string,
    params: { page?: number; limit?: number; year?: string } = {}
  ): Promise<TobaccoRepayListResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.year) query.set("year", params.year);
    const res = await fetch(`${BASE_URL}/tobacco-repays/?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch tobacco repays");
    }
    return res.json();
  },
  getTobaccoRepayHistory: async (
    token: string,
    params: { page?: number; limit?: number; year?: string } = {}
  ): Promise<import("../types").RepayHistoryListResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.year) query.set("year", params.year);
    const res = await fetch(`${BASE_URL}/tobacco-repays/history?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch tobacco repay history");
    }
    return res.json();
  },
  getAvailableYears: async (token: string): Promise<string[]> => {
    const res = await fetch(`${BASE_URL}/tobacco-repays/years`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return [];
    }
    const data: number[] = await res.json();
    return data.map(String);
  },
  createTobaccoRepay: async (token: string, payload: { con_id: number; con_num: string; f_id: number; repay_num?: string; repay_date: string; qty_repay: number; note?: string; oven?: number }): Promise<unknown> => {
    const res = await fetch(`${BASE_URL}/tobacco-repays/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create tobacco repay");
    }
    return res.json();
  },
  getNextRepayNum: async (token: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/tobacco-repays/next-repay-num`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return "";
    return res.json();
  },
  getVendorContracts: async (token: string, vendorId: number): Promise<VendorContractItem[]> => {
    const res = await fetch(`${BASE_URL}/tobacco-repays/contracts?vendor_id=${vendorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },
};
