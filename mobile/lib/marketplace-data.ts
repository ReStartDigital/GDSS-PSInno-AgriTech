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
  freshnessTag: "Fresh today" | "Hot seller" | "Top rated" | "Best value" | "In season";
  accentColor: string;
  tintColor: string;
}

export const marketplaceListings: MarketplaceListing[] = [
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
    farmerId: "farmer-abena-mensah",
    farmer: {
      id: "farmer-abena-mensah",
      fullName: "Abena Mensah Farms",
      phone: "+233244123456",
      rating: 4.8,
      locationLabel: "Dawhenya, Greater Accra",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 12,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#DC2626",
    tintColor: "#FEF2F2",
  },
  {
    id: "listing-green-cabbage",
    cropName: "Green Cabbage",
    description:
      "Crisp cabbage heads sorted by size for chop bars, retailers, and household buyers. Packed to reduce bruising during transport.",
    pricePerUnit: 6,
    unitOfMeasure: "head",
    availableQuantity: 240,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [0.0062, 5.7789] },
    farmerId: "farmer-kojo-asare",
    farmer: {
      id: "farmer-kojo-asare",
      fullName: "Kojo Asare Gardens",
      phone: "+233207654321",
      rating: 4.5,
      locationLabel: "Afienya, Greater Accra",
    },
    category: "Leafy",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 18,
    deliveryEstimate: "1 day",
    freshnessTag: "Best value",
    accentColor: "#15803D",
    tintColor: "#F0FDF4",
  },
  {
    id: "listing-garden-eggs",
    cropName: "Garden Eggs",
    description:
      "Clean white and purple garden eggs for stews and market resale. Graded and ready for pickup with optional basket packaging.",
    pricePerUnit: 9,
    unitOfMeasure: "kg",
    availableQuantity: 420,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [0.0385, 5.675] },
    farmerId: "farmer-esi-agbeko",
    farmer: {
      id: "farmer-esi-agbeko",
      fullName: "Esi Agbeko Produce",
      phone: "+233551112233",
      rating: 4.9,
      locationLabel: "Prampram, Greater Accra",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 26,
    deliveryEstimate: "1 day",
    freshnessTag: "Top rated",
    accentColor: "#6D28D9",
    tintColor: "#F5F3FF",
  },
  {
    id: "listing-green-okra",
    cropName: "Green Okra",
    description:
      "Tender okra pods picked young for maximum freshness. Ideal for soups, restaurants, and buyers who need consistent sizing.",
    pricePerUnit: 10,
    unitOfMeasure: "kg",
    availableQuantity: 180,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.1158, 5.7275] },
    farmerId: "farmer-fatima-issah",
    farmer: {
      id: "farmer-fatima-issah",
      fullName: "Fatima Issah Farm",
      phone: "+233505551111",
      rating: 4.6,
      locationLabel: "Ashaiman, Greater Accra",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 9,
    deliveryEstimate: "Same day",
    freshnessTag: "Hot seller",
    accentColor: "#047857",
    tintColor: "#ECFDF5",
  },
  {
    id: "listing-white-yam",
    cropName: "White Yam",
    description:
      "Firm white yam tubers from a cooperative supplier. Bulk sacks available for longer-distance transport and wholesale orders.",
    pricePerUnit: 15,
    unitOfMeasure: "kg",
    availableQuantity: 800,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.0288, 5.6422] },
    farmerId: "farmer-seidu-alhassan",
    farmer: {
      id: "farmer-seidu-alhassan",
      fullName: "Seidu Alhassan Agro",
      phone: "+233246789000",
      rating: 4.6,
      locationLabel: "Tema, Greater Accra",
    },
    category: "Roots",
    harvestLabel: "In storage",
    packagingRecommendation: "Bulk sacks",
    distanceKm: 31,
    deliveryEstimate: "1-2 days",
    freshnessTag: "In season",
    accentColor: "#92400E",
    tintColor: "#FFF7ED",
  },
];

export const listingCategories = [
  "All",
  "Vegetables",
  "Roots",
  "Leafy",
  "Fruits",
  "Legumes",
] as const;

export type ListingCategoryFilter = (typeof listingCategories)[number];

export function findMarketplaceListing(id: string | undefined) {
  return marketplaceListings.find((listing) => listing.id === id);
}
