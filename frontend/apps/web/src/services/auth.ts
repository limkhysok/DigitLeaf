import { API_BASE_URL } from "./config";
import type { TokenResponse, UserProfile, AuditLogListResponse } from "../types";

export const authApi = {
  async login(username: string, password: string): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    const response = await fetch(`${API_BASE_URL}/auth/login/access-token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }).catch((error) => {
      if (error instanceof Error && error.message === "Failed to fetch") {
        throw new Error("Error Internal Server");
      }
      throw error;
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to login");
    }
    return response.json();
  },

  async getMe(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch user profile");
    }
    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to refresh token");
    }
    return response.json();
  },

  async logout(accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to logout");
    }
    return response.json();
  },

  async getAuditLogs(accessToken: string, page = 1, limit = 20): Promise<AuditLogListResponse> {
    const response = await fetch(`${API_BASE_URL}/audit-logs/?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch audit logs");
    }
    return response.json();
  },
};
