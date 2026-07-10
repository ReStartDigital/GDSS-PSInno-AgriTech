export type ListingStatus = "available" | "pending_delivery" | "sold" | "expired";

export interface MarketplaceFarmer {
  id: string;
  fullName: string;
  phone: string;
  rating: number;
  locationLabel: string;
}

export interface MarketplaceListing {
  id: string;
  cropName: string;
  description: string;
  pricePerUnit: number;
  unitOfMeasure: string;
  availableQuantity: number;
  status: ListingStatus;
  imageUrls: string[];
  pickupLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  farmerId: string;
  farmer: MarketplaceFarmer;
  category: "Vegetables" | "Roots" | "Leafy" | "Fruits" | "Legumes";
  harvestLabel: string;
  packagingRecommendation: string;
  distanceKm: number;
  deliveryEstimate: string;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  freshnessTag: "Fresh today" | "Hot seller" | "Top rated" | "Best value" | "In season";
  accentColor: string;
  tintColor: string;
}

export const listingCategories = [
  "All",
  "Vegetables",
  "Roots",
  "Leafy",
  "Fruits",
  "Legumes",
] as const;

export type ListingCategoryFilter = (typeof listingCategories)[number];
