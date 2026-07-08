import axios from "axios";
import { useAuthStore } from "@vegelink/shared";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach accessToken (and registrationToken if available)
apiClient.interceptors.request.use(
  async (config) => {
    // If request has custom Authorization header (like registrationToken), let it take precedence
    if (config.headers.Authorization) {
      return config;
    }

    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Unwraps VegeLink response wrappers and handles token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Return standard success response data: { success: true, data: ... }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const storedRefreshToken = await SecureStore.getItemAsync("vegelink_refresh_token");
        if (storedRefreshToken) {
          // Trigger token refresh call.
          // Note: we use direct axios here to avoid interceptor loop
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          }, {
            headers: {
              "x-refresh-token": storedRefreshToken,
            }
          });

          if (refreshResponse.data?.success) {
            const { accessToken, refreshToken } = refreshResponse.data.data;
            
            // Save new tokens
            const user = useAuthStore.getState().user;
            if (user) {
              useAuthStore.getState().setAuth(user, accessToken);
            }
            await SecureStore.setItemAsync("vegelink_refresh_token", refreshToken);
            
            // Retry original request with new access token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token is invalid or expired, clear authentication
        useAuthStore.getState().clearAuth();
        await SecureStore.deleteItemAsync("vegelink_refresh_token");
      }
    }
    
    // Normalize server error responses so the caller can handle it in a standard way
    const serverError = error.response?.data || {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error.message || "A network error occurred. Please try again.",
      },
    };
    
    return Promise.reject(serverError);
  }
);
