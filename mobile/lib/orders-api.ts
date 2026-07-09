import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { BackendListing } from "./listings-api";

export interface OrderUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface BackendOrder {
  id: string;
  buyerId: string;
  buyer: OrderUser;
  farmerId: string;
  farmer: OrderUser;
  listingId: string;
  listing: BackendListing;
  mode: "delivery" | "pickup";
  quantityKg: number;
  pricePerKgGhs: number;
  negotiatedPricePerKgGhs: number | null;
  produceSubtotalGhs: number;
  packagingTypeId: string | null;
  packagingType: any;
  transportCostEstimateGhs: number;
  totalGhs: number;
  deliveryAddress: string | null;
  deliveryLocation: any;
  status: string; // backend OrderStatus
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  listing_id: string;
  quantity_kg: number;
  mode: "delivery" | "pickup";
  delivery_address?: string | null;
  delivery_location?: { lat: number; lng: number } | null;
  packaging_type_id?: string | null;
}

// ── QUERY HOOKS ──────────────────────────────────────────────────────────────

export function useOrders(filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: BackendOrder[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>("/orders", { params: filters });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds stale time
  });
}

export function useOrderDetails(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await apiClient.get<BackendOrder>(`/orders/${id}`);
      // The backend GET /orders/:id returns the object directly wrapped inside success:true, data
      // which Axios interceptor unwraps to just the BackendOrder object.
      return response as any;
    },
    enabled: !!id,
  });
}

// ── MUTATION HOOKS (State transitions) ───────────────────────────────────────

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      const response = await apiClient.post<BackendOrder>("/orders", data);
      return response as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/confirm`);
      return response as any;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });
}

export function useDeclineOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/decline`, {
        decline_reason: reason,
      });
      return response as any;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
    },
  });
}

export function useNegotiateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/negotiate`, {
        counter_price_per_kg_ghs: price,
      });
      return response as any;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
    },
  });
}

export function usePackOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/pack`);
      return response as any;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/cancel`, {
        cancellation_reason: reason,
      });
      return response as any;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useMarkReadyForPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<BackendOrder>(`/orders/${id}/ready-pickup`);
      return response as any;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });
}

export function useVerifyPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
      const response = await apiClient.post<BackendOrder>(`/orders/${id}/verify-pickup`, {
        verification_pin: pin,
      });
      return response as any;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
    },
  });
}

// ── UTILITIES ────────────────────────────────────────────────────────────────

export function mapBackendOrderToClient(item: BackendOrder): any {
  // Convert status parameter
  let clientStatus = "pending_payment";
  switch (item.status) {
    case "pending":
    case "pending_agent_confirmation":
    case "pending_sms_confirmation":
    case "negotiating":
      clientStatus = "pending_payment";
      break;
    case "confirmed":
    case "packed":
      clientStatus = "paid";
      break;
    case "in_transit":
    case "arrived_at_doorstep":
      clientStatus = "in_transit";
      break;
    case "delivered":
    case "collected":
      clientStatus = "completed";
      break;
    case "cancelled":
    case "cancelled_expired":
      clientStatus = "cancelled";
      break;
  }

  // Convert confirmationMode
  let confirmationMode: "sms_reply" | "agent_proxy" | "pre_authorised" | "trusted_buyer" = "sms_reply";
  if (item.listing?.autoConfirmUntilKg && item.quantityKg <= item.listing.autoConfirmUntilKg) {
    confirmationMode = "pre_authorised";
  } else if (item.status.includes("agent")) {
    confirmationMode = "agent_proxy";
  }

  const cropName = item.listing?.vegetableType
    ? item.listing.vegetableType.charAt(0).toUpperCase() + item.listing.vegetableType.slice(1)
    : "Roma Tomatoes";

  // Build a timeline based on current status
  const isPending = ["pending", "pending_agent_confirmation", "pending_sms_confirmation", "negotiating"].includes(item.status);
  const isConfirmed = !isPending && item.status !== "cancelled";
  const isPaid = isConfirmed && item.status !== "cancelled";
  const isPacked = ["packed", "in_transit", "arrived_at_doorstep", "delivered", "collected"].includes(item.status);
  const isInTransit = ["in_transit", "arrived_at_doorstep", "delivered", "collected"].includes(item.status);
  const isDone = ["delivered", "collected"].includes(item.status);

  const timeline = [
    {
      title: "Order placed",
      detail: `Buyer requested ${item.quantityKg} kg of ${cropName}.`,
      done: true,
    },
    {
      title: "Order Confirmed",
      detail: isConfirmed ? "Accepted by farmer/agent." : "Awaiting confirmation.",
      done: isConfirmed,
    },
    {
      title: "Payment processed",
      detail: isPaid ? "Payment successfully captured." : "Waiting for settlement.",
      done: isPaid,
    },
    {
      title: "Logistics status",
      detail: isDone
        ? "Deliver successfully completed."
        : isInTransit
        ? "In transit to destination."
        : isPacked
        ? "Packed and ready for pickup."
        : "Awaiting packaging.",
      done: isPacked,
    },
  ];

  return {
    id: item.id,
    listingId: item.listingId,
    cropName,
    quantityOrdered: Number(item.quantityKg),
    unitOfMeasure: "kg",
    totalAmount: Number(item.totalGhs),
    status: clientStatus,
    rawStatus: item.status,
    mode: item.mode,
    deliveryAddress: item.deliveryAddress || "Pickup at Farm",
    traderId: item.buyerId,
    buyerName: item.buyer ? `${item.buyer.firstName} ${item.buyer.lastName}`.trim() : "Vegelink Buyer",
    farmerId: item.farmerId,
    farmerName: item.farmer ? `${item.farmer.firstName} ${item.farmer.lastName}`.trim() : "Vegelink Farmer",
    transporterName: "Local Transport Courier",
    confirmationMode,
    paymentProvider: "MTN MoMo",
    packaging: item.packagingType?.label || "Ventilated crates",
    deliveryOtpRequired: item.mode === "delivery",
    createdAtLabel: new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    updatedAtLabel: new Date(item.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    timeline,
  };
}
