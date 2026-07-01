import { TobaccoRepayListResponse, VendorContractItem, TContractCreate, TContractRead, ConTobaccoItem, RepayHistoryDetail, TContractRepayUpdate, TobaccoRepayContractDetail } from "../types";
import { API_BASE_URL } from "./config";

export const tobaccoRepayApi = {
  getTobaccoRepays: async (
    token: string,
    params: { page?: number; limit?: number; year?: string; search?: string } = {}
  ): Promise<TobaccoRepayListResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.year) query.set("year", params.year);
    if (params.search) query.set("search", params.search);
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/?${query}`, {
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
    params: { page?: number; limit?: number; year?: string; search?: string } = {}
  ): Promise<import("../types").RepayHistoryListResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.year) query.set("year", params.year);
    if (params.search) query.set("search", params.search);
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/history?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch tobacco repay history");
    }
    return res.json();
  },
  exportTobaccoRepayHistory: async (
    token: string,
    params: { representativeId?: number; dateFrom: string; dateTo: string }
  ): Promise<Blob> => {
    const query = new URLSearchParams({ date_from: params.dateFrom, date_to: params.dateTo });
    if (params.representativeId) query.set("representative_id", String(params.representativeId));
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/history/export?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to export tobacco repay history");
    }
    return res.blob();
  },
  getAvailableYears: async (token: string): Promise<string[]> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/years`, {
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
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/`, {
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
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/next-repay-num`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return "";
    return res.json();
  },
  getVendorContracts: async (token: string, vendorId: number): Promise<VendorContractItem[]> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/contracts?vendor_id=${vendorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  },
  getNextContractNum: async (token: string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/next-contract-num`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return "";
    return res.json();
  },
  getContractTobaccoTypes: async (token: string): Promise<ConTobaccoItem[]> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/tobacco-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },
  createContract: async (token: string, payload: TContractCreate): Promise<TContractRead> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/contracts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create contract");
    }
    return res.json();
  },
  getContractRepayDetail: async (token: string, conId: number): Promise<TobaccoRepayContractDetail> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/contracts/${conId}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch contract detail");
    }
    return res.json();
  },
  getRepayDetail: async (token: string, repayId: number): Promise<RepayHistoryDetail> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/${repayId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch repay record");
    }
    return res.json();
  },
  updateTobaccoRepay: async (token: string, repayId: number, payload: TContractRepayUpdate): Promise<unknown> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/${repayId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update repay record");
    }
    return res.json();
  },
  deleteTobaccoRepay: async (token: string, repayId: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/tobacco-repays/${repayId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete repay record");
    }
  },
};
