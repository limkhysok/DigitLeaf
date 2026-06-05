import { TobaccoReturnListResponse, VendorContractItem } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api/v1";

export const tobaccoReturnApi = {
  getTobaccoReturns: async (
    token: string,
    params: { skip?: number; limit?: number; year?: string } = {}
  ): Promise<TobaccoReturnListResponse> => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", String(params.skip));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.year) query.set("year", params.year);
    const res = await fetch(`${BASE_URL}/tobacco-returns/?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch tobacco returns");
    }
    return res.json();
  },
  getAvailableYears: async (token: string): Promise<string[]> => {
    const res = await fetch(`${BASE_URL}/tobacco-returns/years`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },
  createTobaccoReturn: async (token: string, payload: { con_num: string, tobac_type: number, qty_repay: number }): Promise<unknown> => {
    const res = await fetch(`${BASE_URL}/tobacco-returns/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create tobacco return");
    }
    return res.json();
  },
  getVendorContracts: async (token: string, vendorId: number): Promise<VendorContractItem[]> => {
    const res = await fetch(`${BASE_URL}/tobacco-returns/contracts?vendor_id=${vendorId}`, {
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
