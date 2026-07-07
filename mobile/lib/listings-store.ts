import { create } from "zustand";
import { MarketplaceListing } from "./marketplace-data";

export interface FarmerListing extends MarketplaceListing {
  ordersCount: number;
  timeLabel: string;
}

interface ListingsState {
  listings: FarmerListing[];
  addListing: (listing: Omit<FarmerListing, "id" | "farmer" | "farmerId" | "distanceKm" | "deliveryEstimate" | "freshnessTag" | "pickupLocation" | "ordersCount" | "timeLabel">) => void;
  updateListing: (id: string, updatedFields: Partial<FarmerListing>) => void;
  deleteListing: (id: string) => void;
  toggleListingStatus: (id: string) => void;
}

const defaultFarmer = {
  id: "farmer-abena-mensah",
  fullName: "Abena Mensah Farms",
  phone: "+233244123456",
  rating: 4.8,
  locationLabel: "Greater Accra",
};

const initialListings: FarmerListing[] = [
  {
    id: "listing-roma-tomatoes",
    cropName: "Roma Tomatoes",
    description:
      "Firm, bright red tomatoes harvested near Dawhenya this morning. Best for stews, sauces, restaurants, and bulk market buyers.",
    pricePerUnit: 8,
    unitOfMeasure: "kg",
    availableQuantity: 500,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.0194, 5.7023] },
    farmerId: defaultFarmer.id,
    farmer: defaultFarmer,
    category: "Fruits",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 14,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#DC2626",
    tintColor: "#FEF2F2",
    ordersCount: 3,
    timeLabel: "Today",
  },
  {
    id: "listing-garden-pepper",
    cropName: "Garden Pepper",
    description: "Spicy and hot garden peppers, freshly harvested and sorted.",
    pricePerUnit: 12,
    unitOfMeasure: "kg",
    availableQuantity: 300,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.0194, 5.7023] },
    farmerId: defaultFarmer.id,
    farmer: defaultFarmer,
    category: "Vegetables",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 14,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#EF4444",
    tintColor: "#FEF2F2",
    ordersCount: 1,
    timeLabel: "Yesterday",
  },
  {
    id: "listing-green-cabbage-paused",
    cropName: "Green Cabbage",
    description: "Crisp cabbage heads sorted by size, packed to reduce bruising during transport.",
    pricePerUnit: 6,
    unitOfMeasure: "kg",
    availableQuantity: 0,
    status: "paused" as any, // Cast to any to allow "paused" status
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.0194, 5.7023] },
    farmerId: defaultFarmer.id,
    farmer: defaultFarmer,
    category: "Leafy",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 14,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#15803D",
    tintColor: "#F0FDF4",
    ordersCount: 0,
    timeLabel: "3 days ago",
  },
];

export const useListingsStore = create<ListingsState>((set) => ({
  listings: initialListings,

  addListing: (newListing) =>
    set((state) => {
      const id = `listing-${newListing.cropName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const listing: FarmerListing = {
        ...newListing,
        id,
        farmerId: defaultFarmer.id,
        farmer: defaultFarmer,
        distanceKm: 10,
        deliveryEstimate: "Same day",
        freshnessTag: "Fresh today",
        accentColor: newListing.accentColor ?? "#177A33",
        tintColor: newListing.tintColor ?? "#ECFDF3",
        pickupLocation: { type: "Point", coordinates: [-0.0194, 5.7023] },
        ordersCount: 0,
        timeLabel: "Just now",
      };
      return { listings: [listing, ...state.listings] };
    }),

  updateListing: (id, updatedFields) =>
    set((state) => ({
      listings: state.listings.map((l) =>
        l.id === id ? { ...l, ...updatedFields } : l
      ),
    })),

  deleteListing: (id) =>
    set((state) => ({
      listings: state.listings.filter((l) => l.id !== id),
    })),

  toggleListingStatus: (id) =>
    set((state) => ({
      listings: state.listings.map((l) => {
        if (l.id === id) {
          const nextStatus = l.status === "available" ? "paused" : "available";
          return {
            ...l,
            status: nextStatus as any,
          };
        }
        return l;
      }),
    })),
}));
