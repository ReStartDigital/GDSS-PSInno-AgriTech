import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";

export interface LocationDto {
  lat: number;
  lng: number;
}

export interface ListingFarmer {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhotoUrl: string | null;
  region: string | null;
}

export interface PackagingOption {
  id: string;
  code: string;
  label: string;
  protection_level: "high" | "medium" | "low";
  capacity_kg: number;
  category: string;
  reason?: string;
}

export interface BackendListing {
  id: string;
  farmerId: string;
  farmer: ListingFarmer;
  vegetableType: string;
  quantityKg: number;
  pricePerKgGhs: number;
  harvestDate: string;
  images: string[];
  recommendedPackagingId: string | null;
  recommendedPackaging: PackagingOption | null;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: "active" | "sold" | "cancelled";
  supportsDelivery: boolean;
  supportsPickup: boolean;
  autoConfirmUntilKg: number | null;
  autoConfirmPriceFloorGhs: number | null;
  committedKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingDto {
  vegetable_type: string;
  quantity_kg: number;
  price_per_kg_ghs: number;
  harvest_date: string;
  images: string[];
  recommended_packaging_id?: string;
  location: LocationDto;
  supports_delivery: boolean;
  supports_pickup: boolean;
  auto_confirm_until_kg?: number;
  auto_confirm_price_floor_ghs?: number;
  farmer_id?: string;
}

export interface UpdateListingDto {
  vegetable_type?: string;
  quantity_kg?: number;
  price_per_kg_ghs?: number;
  harvest_date?: string;
  images?: string[];
  recommended_packaging_id?: string | null;
  location?: LocationDto;
  status?: "active" | "sold" | "cancelled";
  supports_delivery?: boolean;
  supports_pickup?: boolean;
  auto_confirm_until_kg?: number | null;
  auto_confirm_price_floor_ghs?: number | null;
}

export interface ListingsQueryFilters {
  page?: number;
  limit?: number;
  vegetable_type?: string;
  min_price_kg?: number;
  max_price_kg?: number;
  min_quantity_kg?: number;
  packaging_id?: string;
  fulfilment_mode?: "delivery" | "pickup" | "both";
  lat?: number;
  lng?: number;
  radius_km?: number;
  farmer_id?: string;
}

// ── QUERY HOOKS ──────────────────────────────────────────────────────────────

// Fetch all active listings matching filters
export function useMarketplaceListings(filters: ListingsQueryFilters = {}) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      const response = await apiClient.get<{
        data: BackendListing[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>("/listings", { params: filters });
      return response.data;
    },
    staleTime: 1000 * 60 * 3, // Cache valid for 3 minutes
  });
}

// Fetch single listing by ID
export function useListingDetails(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await apiClient.get<{ listing: BackendListing }>(`/listings/${id}`);
      return response.data.listing;
    },
    enabled: !!id,
  });
}

// Fetch recommended packaging catalog for crop type
export function useRecommendPackaging(vegetableType: string) {
  return useQuery({
    queryKey: ["packaging-recommend", vegetableType],
    queryFn: async () => {
      const response = await apiClient.get<{ recommendations: PackagingOption[] }>(
        "/listings/packaging/recommend",
        { params: { vegetable_type: vegetableType } }
      );
      return response.data.recommendations;
    },
    enabled: !!vegetableType,
  });
}

// ── MUTATION HOOKS ───────────────────────────────────────────────────────────

// Create new crop listing
export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateListingDto) => {
      const response = await apiClient.post<{ listing: BackendListing }>("/listings", data);
      return response.data.listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// Update existing crop listing details
export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateListingDto }) => {
      const response = await apiClient.patch<{ listing: BackendListing }>(`/listings/${id}`, data);
      return response.data.listing;
    },
    onSuccess: (updatedListing, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
    },
  });
}

// Soft-delete/cancel crop listing
export function useCancelListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ message: string }>(`/listings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// Upload dynamic photo to Cloudinary
export function useUploadListingImage() {
  return useMutation({
    mutationFn: async (imageFileUri: string) => {
      const formData = new FormData();
      const filename = imageFileUri.split("/").pop() || "upload.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append("image", {
        uri: imageFileUri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post<{ url: string; thumbnail_url: string }>(
        "/listings/images",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
  });
}

// ── UTILITIES ────────────────────────────────────────────────────────────────

export function mapBackendListingToClient(item: BackendListing): any {
  const cropName = item.vegetableType.charAt(0).toUpperCase() + item.vegetableType.slice(1);
  const harvestDate = new Date(item.harvestDate);
  const today = new Date();
  const isHarvestedToday =
    !Number.isNaN(harvestDate.getTime()) &&
    harvestDate.toDateString() === today.toDateString();
  
  // Choose accent/tint colors dynamically based on category/crop name
  let accentColor = "#15803D"; // green default
  let tintColor = "#F0FDF4";
  
  const name = item.vegetableType.toLowerCase();
  if (name.includes("tomato") || name.includes("pepper") || name.includes("chili")) {
    accentColor = "#DC2626"; // red
    tintColor = "#FEF2F2";
  } else if (name.includes("yam") || name.includes("potato") || name.includes("onion") || name.includes("carrot")) {
    accentColor = "#EA580C"; // orange/amber
    tintColor = "#FFF7ED";
  }
  
  return {
    id: item.id,
    cropName,
    description: item.harvestDate ? `Harvest date: ${item.harvestDate}` : "Fresh produce from farm",
    pricePerUnit: Number(item.pricePerKgGhs),
    unitOfMeasure: "kg",
    availableQuantity: Number(item.quantityKg) - Number(item.committedKg),
    status: item.status === "active" ? "available" : item.status === "sold" ? "sold" : "expired",
    imageUrls: item.images || [],
    pickupLocation: item.location,
    farmerId: item.farmerId,
    farmer: {
      id: item.farmer?.id || item.farmerId,
      fullName: item.farmer ? `${item.farmer.firstName} ${item.farmer.lastName}`.trim() : "Vegelink Farmer",
      phone: item.farmer?.phone || "",
      rating: 0,
      locationLabel: item.farmer?.region || "Ghana",
    },
    category: "Vegetables",
    harvestLabel: `Harvested ${item.harvestDate}`,
    packagingRecommendation: item.recommendedPackaging?.label || "Standard packaging",
    distanceKm: 0,
    deliveryEstimate: item.supportsDelivery ? "Delivery available" : "Pickup only",
    supportsDelivery: item.supportsDelivery,
    supportsPickup: item.supportsPickup,
    freshnessTag: isHarvestedToday ? "Fresh today" : "In season",
    accentColor,
    tintColor,
    ordersCount: 0,
    timeLabel: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

