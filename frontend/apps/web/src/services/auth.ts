import { API_BASE_URL } from "./config";
import type { TokenResponse, UserProfile, UserSession, AuditLog } from "../types";

export const authApi = {
  async login(username: string, password: string): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    const response = await fetch(`${API_BASE_URL}/auth/login/access-token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
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

  async requestOTP(userName: string): Promise<{ message: string; otp?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login/otp-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to request OTP");
    }
    return response.json();
  },

  async verifyOTP(userName: string, otpCode: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/otp-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName, otp_code: otpCode }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to verify OTP");
    }
    return response.json();
  },

  async setupTOTP(accessToken: string): Promise<{ secret: string; uri: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/totp/setup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to setup TOTP");
    }
    return response.json();
  },

  async enableTOTP(accessToken: string, userName: string, totpCode: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/totp/enable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName, totp_code: totpCode }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to enable TOTP");
    }
    return response.json();
  },

  async disableTOTP(accessToken: string, userName: string, totpCode: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/totp/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName, totp_code: totpCode }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to disable TOTP");
    }
    return response.json();
  },

  async verifyTOTP(userName: string, totpCode: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/totp-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: userName, totp_code: totpCode }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to verify TOTP");
    }
    return response.json();
  },

  async getSessions(accessToken: string): Promise<UserSession[]> {
    const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch sessions");
    }
    return response.json();
  },

  async getAuditLogs(accessToken: string, skip = 0, limit = 100): Promise<AuditLog[]> {
    const response = await fetch(`${API_BASE_URL}/audit-logs/?skip=${skip}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to fetch audit logs");
    }
    return response.json();
  },
};
