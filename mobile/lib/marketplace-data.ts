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
    id: "listing-spring-onion",
    cropName: "Spring Onion",
    description:
      "Bunched spring onions from Greater Accra peri-urban farms. Bright green tops, mild white bulbs. Freshly cut this morning. Ideal for soups, omelettes, and garnish.",
    pricePerUnit: 5,
    unitOfMeasure: "bunch",
    availableQuantity: 200,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.1869, 5.6037] },
    farmerId: "farmer-nana-owusu",
    farmer: {
      id: "farmer-nana-owusu",
      fullName: "Nana Owusu Market",
      phone: "+2332059983273",
      rating: 4.3,
      locationLabel: "Greater Accra Region",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Tied bundles",
    distanceKm: 12,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#D97706",
    tintColor: "#ECFDF3",
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
      locationLabel: "Ashanti",
    },
    category: "Leafy",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 28,
    deliveryEstimate: "1 day",
    freshnessTag: "Fresh today",
    accentColor: "#15803D",
    tintColor: "#F0FDF4",
  },
  {
    id: "listing-green-beans",
    cropName: "Green Beans",
    description:
      "Export quality green beans with clean pods and consistent sizing. Packed in small crates for hotels, restaurants, and retail buyers.",
    pricePerUnit: 18,
    unitOfMeasure: "kg",
    availableQuantity: 160,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [0.0385, 5.675] },
    farmerId: "farmer-esi-agbeko",
    farmer: {
      id: "farmer-esi-agbeko",
      fullName: "Esi Agbeko Produce",
      phone: "+233551112233",
      rating: 4.5,
      locationLabel: "Ashanti",
    },
    category: "Legumes",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 30,
    deliveryEstimate: "1 day",
    freshnessTag: "Top rated",
    accentColor: "#8B1E1E",
    tintColor: "#ECFDF3",
  },
  {
    id: "listing-fresh-carrots",
    cropName: "Fresh Carrots",
    description:
      "Bright orange carrots, trimmed and sorted for market stalls and kitchen use. Sweet, firm, and packed for low bruising.",
    pricePerUnit: 14,
    unitOfMeasure: "kg",
    availableQuantity: 320,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.1158, 5.7275] },
    farmerId: "farmer-fatima-issah",
    farmer: {
      id: "farmer-fatima-issah",
      fullName: "Fatima Issah Farm",
      phone: "+233505551111",
      rating: 4.8,
      locationLabel: "Ashanti",
    },
    category: "Roots",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 32,
    deliveryEstimate: "Same day",
    freshnessTag: "Best value",
    accentColor: "#EA580C",
    tintColor: "#FFF7ED",
  },
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
      locationLabel: "Greater Accra",
    },
    category: "Fruits",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 14,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#DC2626",
    tintColor: "#FEF2F2",
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
      locationLabel: "Northern",
    },
    category: "Roots",
    harvestLabel: "In storage",
    packagingRecommendation: "Bulk sacks",
    distanceKm: 34,
    deliveryEstimate: "1-2 days",
    freshnessTag: "In season",
    accentColor: "#92400E",
    tintColor: "#FFF7ED",
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
    farmerId: "farmer-akua-sarpong",
    farmer: {
      id: "farmer-akua-sarpong",
      fullName: "Akua Sarpong Farm",
      phone: "+233502221111",
      rating: 4.6,
      locationLabel: "Eastern",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Ventilated crates",
    distanceKm: 18,
    deliveryEstimate: "Same day",
    freshnessTag: "Hot seller",
    accentColor: "#047857",
    tintColor: "#ECFDF5",
  },
  {
    id: "listing-chili-pepper",
    cropName: "Chili Pepper",
    description:
      "Fresh red chili pepper with strong aroma and heat. Sorted into clean bags for market retailers and food processors.",
    pricePerUnit: 10,
    unitOfMeasure: "kg",
    availableQuantity: 210,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.1632, 5.6304] },
    farmerId: "farmer-ama-adjei",
    farmer: {
      id: "farmer-ama-adjei",
      fullName: "Ama Adjei Produce",
      phone: "+233246100222",
      rating: 4.4,
      locationLabel: "Volta",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Open crates",
    distanceKm: 24,
    deliveryEstimate: "Same day",
    freshnessTag: "Hot seller",
    accentColor: "#EF4444",
    tintColor: "#FEF2F2",
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
    farmerId: "farmer-esi-badu",
    farmer: {
      id: "farmer-esi-badu",
      fullName: "Esi Badu Produce",
      phone: "+233551112234",
      rating: 4.7,
      locationLabel: "Western",
    },
    category: "Vegetables",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Plastic baskets",
    distanceKm: 26,
    deliveryEstimate: "1 day",
    freshnessTag: "Top rated",
    accentColor: "#7C3AED",
    tintColor: "#F5F3FF",
  },
  {
    id: "listing-pineapple",
    cropName: "Sweet Pineapple",
    description:
      "Juicy pineapples from Nsawam growers. Good for juice bars, restaurants, and market stands needing sorted fruit.",
    pricePerUnit: 7,
    unitOfMeasure: "piece",
    availableQuantity: 260,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.3501, 5.8089] },
    farmerId: "farmer-yaw-boateng",
    farmer: {
      id: "farmer-yaw-boateng",
      fullName: "Yaw Boateng Farms",
      phone: "+233244001144",
      rating: 4.5,
      locationLabel: "Eastern",
    },
    category: "Fruits",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Stacked crates",
    distanceKm: 35,
    deliveryEstimate: "1 day",
    freshnessTag: "In season",
    accentColor: "#EAB308",
    tintColor: "#FEFCE8",
  },
  {
    id: "listing-black-eyed-beans",
    cropName: "Black Eyed Beans",
    description:
      "Clean dry beans bagged for wholesale buyers and chop bars. Screened to remove stones before pickup.",
    pricePerUnit: 16,
    unitOfMeasure: "kg",
    availableQuantity: 640,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-1.029, 7.9465] },
    farmerId: "farmer-hawa-ibrahim",
    farmer: {
      id: "farmer-hawa-ibrahim",
      fullName: "Hawa Ibrahim Co-op",
      phone: "+233552229900",
      rating: 4.4,
      locationLabel: "Brong-Ahafo",
    },
    category: "Legumes",
    harvestLabel: "In storage",
    packagingRecommendation: "Sealed sacks",
    distanceKm: 42,
    deliveryEstimate: "2 days",
    freshnessTag: "Best value",
    accentColor: "#7F1D1D",
    tintColor: "#FEF2F2",
  },
  {
    id: "listing-lettuce",
    cropName: "Fresh Lettuce",
    description:
      "Tender lettuce heads washed and packed for quick delivery. Best for hotels, restaurants, and salad vendors.",
    pricePerUnit: 4,
    unitOfMeasure: "head",
    availableQuantity: 190,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.2137, 5.6501] },
    farmerId: "farmer-kwesi-lartey",
    farmer: {
      id: "farmer-kwesi-lartey",
      fullName: "Kwesi Lartey Greens",
      phone: "+233204445566",
      rating: 4.2,
      locationLabel: "Greater Accra",
    },
    category: "Leafy",
    harvestLabel: "Harvested today",
    packagingRecommendation: "Cool baskets",
    distanceKm: 10,
    deliveryEstimate: "Same day",
    freshnessTag: "Fresh today",
    accentColor: "#22C55E",
    tintColor: "#F0FDF4",
  },
  {
    id: "listing-sweet-potato",
    cropName: "Sweet Potato",
    description:
      "Medium sweet potatoes with clean skins and firm texture. Packed in sacks for easy loading and delivery.",
    pricePerUnit: 11,
    unitOfMeasure: "kg",
    availableQuantity: 360,
    status: "available",
    imageUrls: [],
    pickupLocation: { type: "Point", coordinates: [-0.4502, 5.579] },
    farmerId: "farmer-adwoa-frimpong",
    farmer: {
      id: "farmer-adwoa-frimpong",
      fullName: "Adwoa Frimpong Farm",
      phone: "+233271009988",
      rating: 4.6,
      locationLabel: "Ashanti",
    },
    category: "Roots",
    harvestLabel: "Harvested yesterday",
    packagingRecommendation: "Bulk sacks",
    distanceKm: 37,
    deliveryEstimate: "1 day",
    freshnessTag: "In season",
    accentColor: "#C2410C",
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
