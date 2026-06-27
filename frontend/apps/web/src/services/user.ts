import { API_BASE_URL } from "./config";
import type { UserProfile, UserCreate, RegionItem, RoleItem } from "../types";

export const userApi = {
  async createUser(accessToken: string, data: UserCreate): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create user");
    }
    return response.json();
  },

  async listUsers(accessToken: string): Promise<UserProfile[]> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch members");
    }
    return response.json();
  },

  async setUserRegions(accessToken: string, userId: number, regions: number[]): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/regions`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ regions }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update regions");
    }
    return response.json();
  },

  async getAssignableRegions(accessToken: string): Promise<RegionItem[]> {
    const response = await fetch(`${API_BASE_URL}/users/regions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch assignable regions");
    }
    return response.json();
  },

  async getRoles(accessToken: string): Promise<RoleItem[]> {
    const response = await fetch(`${API_BASE_URL}/users/roles`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch roles");
    }
    return response.json();
  },

  async setUserRole(accessToken: string, userId: number, roleId: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update role");
    }
    return response.json();
  },

  async deleteUser(accessToken: string, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete member");
    }
  },
};
