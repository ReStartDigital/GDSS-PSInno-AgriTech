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
  PENDING_PAYMENT = "pending_payment",
  PAID = "paid",
  IN_TRANSIT = "in_transit",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
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
