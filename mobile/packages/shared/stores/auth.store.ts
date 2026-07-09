import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type UserRole = "farmer" | "buyer" | "transporter" | "agent" | "admin";

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () => {
    SecureStore.deleteItemAsync("vegelink_refresh_token").catch(() => {});
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));

