export enum UserRole {
  FARMER = "farmer",
  BUYER = "buyer",
  TRANSPORTER = "transporter",
  AGENT = "agent",
  ADMIN = "admin",
}

export const REGISTERABLE_ROLES: UserRole[] = [
  UserRole.FARMER,
  UserRole.BUYER,
  UserRole.TRANSPORTER,
  UserRole.AGENT,
];

export enum ListingStatus {
  AVAILABLE = "available",
  PENDING_DELIVERY = "pending_delivery",
  SOLD = "sold",
  EXPIRED = "expired",
}

export enum OrderStatus {
  PENDING = "pending",
  PENDING_AGENT_CONFIRMATION = "pending_agent_confirmation",
  PENDING_SMS_CONFIRMATION = "pending_sms_confirmation",
  NEGOTIATING = "negotiating",
  CONFIRMED = "confirmed",
  PACKED = "packed",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  COLLECTED = "collected", // pickup fulfilment
  CANCELLED = "cancelled",
  CANCELLED_EXPIRED = "cancelled_expired",
  FARMER_DISPUTED = "farmer_disputed",
}

export enum FulfilmentMode {
  DELIVERY = "delivery",
  PICKUP = "pickup",
}


export enum TransactionType {
  DEPOSIT = "deposit",
  PAYOUT = "payout",
  ESCROW_LOCK = "escrow_lock",
  ESCROW_RELEASE = "escrow_release",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}
