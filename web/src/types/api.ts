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

export interface ListingResponse {
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
    coordinates: [number, number];
  };
  status: "active" | "sold" | "cancelled";
  supportsDelivery: boolean;
  supportsPickup: boolean;
  autoConfirmUntilKg: number | null;
  autoConfirmPriceFloorGhs: number | null;
  committedKg: number;
  createdAt: string;
  updatedAt: string;
  agriScore?: number;
  isUrgent?: boolean;
  freshness?: 'High' | 'Medium' | 'Low';
}

export interface Order {
  id: string;
  status: string;
  mode?: string;
  createdAt: string;
  updatedAt: string;
  totalGhs: number;
  quantityKg: number;
  pricePerKgGhs?: number;
  deliveryAddress?: string;
  listing?: ListingResponse;
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  transporter?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export interface ApiErrorShape {
  response?: {
    data?: {
      error?: {
        message: string;
        details?: Record<string, string[]>;
      };
    };
  };
}
