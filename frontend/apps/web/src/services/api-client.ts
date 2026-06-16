import { authApi } from "./auth";
import { userApi } from "./user";
import { sackRegistrationApi } from "./sack-registration";
import { tobaccoPurchaseApi } from "./tobacco-purchase";
import { tobaccoRepayApi } from "./tobacco-repay";

// Re-export all types
export * from "../types";

// Re-export the assembled API client for backward compatibility
export const apiClient = {
  ...authApi,
  ...userApi,
  ...sackRegistrationApi,
  ...tobaccoPurchaseApi,
  ...tobaccoRepayApi,
};
