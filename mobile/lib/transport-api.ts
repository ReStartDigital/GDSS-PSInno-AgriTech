import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { BackendOrder, OrderUser } from "./orders-api";

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface BackendTransportRequest {
  id: string;
  orderId: string;
  order?: BackendOrder;
  transporterId: string | null;
  transporter?: OrderUser | null;
  pickupLocation: { type: "Point"; coordinates: [number, number] };
  dropoffLocation: { type: "Point"; coordinates: [number, number] };
  distanceKm: number | null;
  estimatedCostGhs: number | null;
  packagingTypeName: string | null;
  specialHandling: string | null;
  status: "open" | "accepted" | "in_transit" | "delivered" | "cancelled" | "en_route";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransportRequestDto {
  order_id: string;
  pickup_location: { latitude: number; longitude: number };
  dropoff_location: { latitude: number; longitude: number };
  packaging_type_name: string;
  special_handling?: string;
}

export interface AvailableJobsFilters {
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

// ── QUERY HOOKS ──────────────────────────────────────────────────────────────

export function useAvailableJobs(filters: AvailableJobsFilters = {}) {
  return useQuery({
    queryKey: ["transport", "available", filters],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: BackendTransportRequest[];
        meta: {
          total_records: number;
          current_page: number;
          limit: number;
        };
      }>("/transport/available", { params: filters });
      return response as any;
    },
    staleTime: 1000 * 15, // 15 seconds — jobs board changes frequently
  });
}

// ── MUTATION HOOKS ───────────────────────────────────────────────────────────

/** Farmer requests transport hauling for a confirmed order */
export function useRequestTransport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransportRequestDto) => {
      const response = await apiClient.post<BackendTransportRequest>(
        "/transport/request",
        data,
      );
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Transporter claims an open shipping job */
export function useAcceptJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transportRequestId: string) => {
      const response = await apiClient.patch<BackendTransportRequest>(
        `/transport/${transportRequestId}/accept`,
      );
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Transporter checks in at buyer's doorstep — triggers OTP to buyer */
export function useTriggerArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transportRequestId: string) => {
      const response = await apiClient.patch<BackendTransportRequest>(
        `/transport/${transportRequestId}/arrive`,
      );
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Transporter submits buyer's OTP to finalize delivery */
export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transportRequestId,
      pin,
    }: {
      transportRequestId: string;
      pin: string;
    }) => {
      const response = await apiClient.post<BackendTransportRequest>(
        `/transport/${transportRequestId}/delivered`,
        { verification_pin: pin },
      );
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ── UTILITIES ────────────────────────────────────────────────────────────────

/** Map a backend transport request to a shape suitable for the jobs UI */
export function mapTransportJobToClient(item: BackendTransportRequest) {
  const order = item.order;
  const cropName = order?.listing?.vegetableType
    ? order.listing.vegetableType.charAt(0).toUpperCase() +
      order.listing.vegetableType.slice(1)
    : "Produce";

  const quantityText = order ? `${order.quantityKg} kg` : "—";
  const buyerName = order?.buyer
    ? `${order.buyer.firstName} ${order.buyer.lastName}`.trim()
    : "Buyer";
  const farmerName = order?.farmer
    ? `${order.farmer.firstName} ${order.farmer.lastName}`.trim()
    : "Farmer";

  // Derive readable addresses from GeoJSON coordinates
  const pickupCoords = item.pickupLocation?.coordinates;
  const dropoffCoords = item.dropoffLocation?.coordinates;
  const pickupAddress = pickupCoords
    ? `${pickupCoords[1].toFixed(4)}°N, ${pickupCoords[0].toFixed(4)}°W`
    : "Farm location";
  const deliveryAddress = dropoffCoords
    ? `${dropoffCoords[1].toFixed(4)}°N, ${dropoffCoords[0].toFixed(4)}°W`
    : "Delivery location";

  return {
    id: item.id,
    orderId: item.orderId,
    cropName,
    quantityText,
    buyerName,
    farmerName,
    pickupAddress,
    deliveryAddress,
    payoutGhs: Number(item.estimatedCostGhs || 0),
    distanceKm: Number(item.distanceKm || 0),
    status: item.status,
    transporterId: item.transporterId,
    transporterName: item.transporter
      ? `${item.transporter.firstName} ${item.transporter.lastName}`.trim()
      : undefined,
    createdAt: item.createdAt,
  };
}
