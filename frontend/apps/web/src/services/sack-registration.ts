import { API_BASE_URL } from "./config";
import type {
  RepresentItem,
  MemberFarmerItem,
  SackRegistrationItem,
  SackRegistrationCreate,
  SackRegistrationUpdate,
  SackRegistrationListParams,
  SackRegistrationListResponse,
  SackStatusCounts,
  SackStatusCountsParams,
  SackRegistrationStats,
  FarmerContractListResponse,
} from "../types";

export const sackRegistrationApi = {
  async getRepresents(accessToken: string): Promise<RepresentItem[]> {
    const response = await fetch(`${API_BASE_URL}/farmers/represents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch represents");
    }
    return response.json();
  },

  async searchMemberFarmer(
    accessToken: string,
    params: { name?: string; identity_card?: string }
  ): Promise<MemberFarmerItem> {
    const query = new URLSearchParams();
    if (params.name) query.append("name", params.name);
    if (params.identity_card) query.append("identity_card", params.identity_card);
    const response = await fetch(
      `${API_BASE_URL}/farmers/member-farmers?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Member farmer not found");
    }
    const list: MemberFarmerItem[] = await response.json();
    if (list.length === 0) throw new Error("Member farmer not found");
    return list[0]!;
  },

  async queryMemberFarmers(
    accessToken: string,
    q: string,
    representId?: number,
    limit = 10
  ): Promise<MemberFarmerItem[]> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (representId !== undefined) params.set("represent_id", String(representId));
    const response = await fetch(
      `${API_BASE_URL}/farmers/member-farmers?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to query farmers");
    }
    return response.json();
  },

  async getMemberFarmers(
    accessToken: string,
    q: string,
    representId?: number,
    limit = 10
  ): Promise<MemberFarmerItem[]> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (representId !== undefined) params.set("represent_id", String(representId));
    const response = await fetch(
      `${API_BASE_URL}/farmers/member-farmers?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch member farmers");
    }
    return response.json();
  },

  async getSackRegistrations(
    accessToken: string,
    params: SackRegistrationListParams = {}
  ): Promise<SackRegistrationListResponse> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    if (params.sort_sack_in_kg) query.set("sort_sack_in_kg", params.sort_sack_in_kg);
    const response = await fetch(
      `${API_BASE_URL}/sack-registrations/?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch registrations");
    }
    return response.json();
  },

  async exportSackRegistrations(
    accessToken: string,
    params: SackRegistrationListParams = {}
  ): Promise<Blob> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    
    const response = await fetch(
      `${API_BASE_URL}/sack-registrations/export?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to export registrations");
    }
    return response.blob();
  },

  async createSackRegistration(
    accessToken: string,
    data: SackRegistrationCreate
  ): Promise<SackRegistrationItem> {
    const response = await fetch(`${API_BASE_URL}/sack-registrations/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create registration");
    }
    return response.json();
  },

  async updateSackRegistration(
    accessToken: string,
    sackId: number,
    data: SackRegistrationUpdate
  ): Promise<SackRegistrationItem> {
    const response = await fetch(`${API_BASE_URL}/sack-registrations/${sackId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update registration");
    }
    return response.json();
  },

  async getSackStatusCounts(
    accessToken: string,
    params: SackStatusCountsParams = {}
  ): Promise<SackStatusCounts> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    const response = await fetch(
      `${API_BASE_URL}/sack-registrations/status-counts?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch status counts");
    }
    return response.json();
  },

  async getSackRegistrationStats(accessToken: string): Promise<SackRegistrationStats> {
    const response = await fetch(`${API_BASE_URL}/sack-registrations/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch stats");
    }
    return response.json();
  },

  async getSackRegistration(accessToken: string, sackId: number): Promise<SackRegistrationItem> {
    const response = await fetch(`${API_BASE_URL}/sack-registrations/${sackId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Sack registration not found");
    }
    return response.json();
  },

  async deleteSackRegistration(accessToken: string, sackId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sack-registrations/${sackId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete registration");
    }
  },

  async getFarmerContracts(
    accessToken: string,
    params: { year?: number; page?: number; limit?: number } = {}
  ): Promise<FarmerContractListResponse> {
    const query = new URLSearchParams();
    if (params.year !== undefined) query.set("year", String(params.year));
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    const response = await fetch(
      `${API_BASE_URL}/farmer-contract/?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch farmer contracts");
    }
    return response.json();
  },
};
