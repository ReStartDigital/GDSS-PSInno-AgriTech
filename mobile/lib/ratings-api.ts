import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface SubmitRatingDto {
  order_id: string;
  ratee_id: string;
  score: number; // 1-5
  comment?: string;
}

export interface RatingItem {
  id: string;
  score: number;
  comment: string | null;
  role_rated: string;
  created_at: string;
  partner: {
    id: string;
    name: string;
  };
}

export type RatingDirection = "given" | "received";

export interface RatingsFilters {
  page?: number;
  limit?: number;
  direction?: RatingDirection;
}

// ── QUERY HOOKS ──────────────────────────────────────────────────────────────

/** Fetch paginated ratings history (given or received) for the authenticated user */
export function useMyRatings(filters: RatingsFilters = {}) {
  const params = {
    page: filters.page || 1,
    limit: filters.limit || 20,
    direction: filters.direction || "received",
  };

  return useQuery({
    queryKey: ["ratings", "me", params],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: RatingItem[];
        meta: {
          total_records: number;
          current_page: number;
          limit: number;
          total_pages: number;
        };
      }>("/ratings/me", { params });
      return response as any;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// ── MUTATION HOOKS ───────────────────────────────────────────────────────────

/** Submit a 1-5 star rating with optional comment for a terminal order */
export function useSubmitRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitRatingDto) => {
      const response = await apiClient.post<any>("/ratings", data);
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
