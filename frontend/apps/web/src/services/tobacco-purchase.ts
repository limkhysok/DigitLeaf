import { API_BASE_URL } from "./config";
import type {
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
  TobaccoPurchase,
  TobaccoPurchaseCreate,
  TobaccoPurchaseListResponse,
  TobaccoPurchaseListParams,
  TobaccoPurchaseFormMetadata,
  MemberFarmerItem,
} from "../types";

export const tobaccoPurchaseApi = {
  async getFormMetadata(accessToken: string): Promise<TobaccoPurchaseFormMetadata> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/form-metadata`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch form metadata");
    }
    return response.json();
  },

  async getPurchasers(accessToken: string): Promise<PurchaserItem[]> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/purchasers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch purchasers");
    }
    return response.json();
  },

  async getRegions(accessToken: string): Promise<RegionItem[]> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/regions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch regions");
    }
    return response.json();
  },

  async getOvens(accessToken: string): Promise<OvenItem[]> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/ovens`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch ovens");
    }
    return response.json();
  },

  async getTobaccoTypes(accessToken: string): Promise<TobaccoItem[]> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/tobacco-types`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch tobacco types");
    }
    return response.json();
  },

  async getVendorsByBuyer(accessToken: string, buyerId: number): Promise<MemberFarmerItem[]> {
    const response = await fetch(
      `${API_BASE_URL}/tobacco-purchases/vendors?buyer_id=${buyerId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch vendors");
    }
    return response.json();
  },

  async getVendorSack(accessToken: string, vendorId: number): Promise<{ sack_in_kg: number | null; total_sack_in_kg?: number }> {
    const response = await fetch(
      `${API_BASE_URL}/tobacco-purchases/vendor-sack?vendor_id=${vendorId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) return { sack_in_kg: null, total_sack_in_kg: 0 };
    return response.json();
  },

  async getTobaccoPurchases(
    accessToken: string,
    params: TobaccoPurchaseListParams = {}
  ): Promise<TobaccoPurchaseListResponse> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.buyer != null) query.set("buyer", String(params.buyer));
    if (params.region != null) query.set("region", String(params.region));
    if (params.oven != null) query.set("oven", String(params.oven));
    if (params.sort_grand_total) query.set("sort_grand_total", params.sort_grand_total);
    if (params.sort_net_weight) query.set("sort_net_weight", params.sort_net_weight);

    const response = await fetch(
      `${API_BASE_URL}/tobacco-purchases/?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch purchases");
    }
    return response.json();
  },

  async createTobaccoPurchase(accessToken: string, data: TobaccoPurchaseCreate): Promise<TobaccoPurchase | null> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create purchase");
    }
    return response.json();
  },

  async getTobaccoPurchase(accessToken: string, tp_id: number): Promise<TobaccoPurchase> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/${tp_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch purchase details");
    }
    return response.json();
  },

  async updateTobaccoPurchase(accessToken: string, tp_id: number, data: Partial<TobaccoPurchaseCreate>): Promise<TobaccoPurchase> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/${tp_id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update purchase");
    }
    return response.json();
  },

  async deleteTobaccoPurchase(accessToken: string, tp_id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/${tp_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete purchase");
    }
  },

  async exportTobaccoPurchaseTemplate(accessToken: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tobacco-purchases/report/template`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to export purchase template");
    }
    return response.blob();
  },
};
