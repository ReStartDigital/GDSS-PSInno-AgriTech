import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  phone: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  role: string;
  profilePhotoUrl: string | null;
  region: string | null;
  language: string | null;
  isActive: boolean;
  managedByAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsMetrics {
  totalEarningsGhs: number;
  pendingPayoutGhs: number;
  completedOrders: number;
  activeListings: number;
  totalOrders: number;
  conversionRate: number;
  averageOrderValueGhs: number;
}

export interface PaymentDetailsDto {
  provider: "mtn_momo" | "telecel_cash" | "at_money";
  account_number: string;
  account_name: string;
}

export interface ManagedClient {
  id: string;
  phone: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  role: string;
  profilePhotoUrl: string | null;
  region: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterClientDto {
  phone: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  role: "farmer" | "buyer" | "transporter" | "agent" | "admin";
  region?: string;
}

function unwrapApiData<T>(response: any): T {
  return response?.success === true && "data" in response ? response.data : response;
}

function unwrapUser<T>(response: any): T {
  const data = unwrapApiData<any>(response);
  return data?.user ?? data;
}

// ── PROFILE HOOKS ────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>("/users/me");
      return unwrapUser<UserProfile>(response);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<{
      firstName: string;
      middleName: string | null;
      lastName: string;
      email: string | null;
      region: string;
      language: string;
    }>) => {
      const response = await apiClient.patch<UserProfile>("/users/me", data);
      return unwrapUser<UserProfile>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post<{ url: string }>("/users/me/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return unwrapApiData<{ url: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useChangePin() {
  return useMutation({
    mutationFn: async (data: { current_pin: string; new_pin: string }) => {
      const response = await apiClient.patch("/users/me/pin", data);
      return unwrapApiData(response);
    },
  });
}

// ── EARNINGS / PAYMENT HOOKS ─────────────────────────────────────────────────

export function useMyEarnings() {
  return useQuery({
    queryKey: ["earnings", "me"],
    queryFn: async () => {
      const response = await apiClient.get<EarningsMetrics>("/users/me/earnings");
      return unwrapApiData<EarningsMetrics>(response);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useConfigurePaymentDetails() {
  return useMutation({
    mutationFn: async (data: PaymentDetailsDto) => {
      const response = await apiClient.post("/users/me/payment-details", data);
      return unwrapApiData(response);
    },
  });
}

// ── AGENT MANAGEMENT HOOKS ───────────────────────────────────────────────────

export function useAgentClients(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["agent", "clients", filters],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: ManagedClient[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>("/users/agent/clients", { params: filters });
      return unwrapApiData(response);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRegisterClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegisterClientDto) => {
      const response = await apiClient.post<ManagedClient>("/users/agent/clients", data);
      return unwrapUser<ManagedClient>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", "clients"] });
    },
  });
}

export function useUnassignClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiClient.patch(`/users/agent/clients/${clientId}/unassign`);
      return unwrapApiData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", "clients"] });
    },
  });
}

// ── PUBLIC PROFILE ───────────────────────────────────────────────────────────

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>(`/users/${userId}`);
      return unwrapUser<UserProfile>(response);
    },
    enabled: !!userId,
  });
}
