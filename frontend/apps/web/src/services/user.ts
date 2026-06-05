import { API_BASE_URL } from "./config";
import type { UserProfile, UserCreate, UserChangePassword, UserAdminResetPassword } from "../types";

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

  async changePassword(accessToken: string, data: UserChangePassword): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to change password");
    }
    return response.json();
  },

  async adminResetPassword(accessToken: string, userId: number, data: UserAdminResetPassword): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to reset password");
    }
    return response.json();
  },
};
