import { UserRole } from "../../../common/constants/roles.enums.js";
import type { User } from "../../../database/entities/User.js";
import type { AgentAssignment } from "../../../database/entities/AgentAssignment.js";

// ── User factories ────────────────────────────────────────────────────────────

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-abc-123",
    phone: "+233244123456",
    firstName: "Abena",
    lastName: "Mensah",
    role: UserRole.FARMER,
    email: "user_233244123456@vegelink.app",
    pinHash: "$2b$12$hashedpin",
    isPhoneVerified: true,
    isActive: true,
    profilePhotoUrl: null,
    location: null,
    mobileMoneyNumber: null,
    mobileMoneyNetwork: null,
    paystackSubaccountCode: null,
    paymentDetailsSet: false,
    createdAt: new Date("2026-06-01T08:00:00Z"),
    updatedAt: new Date("2026-06-01T08:00:00Z"),
    ...overrides,
  } as User;
}

export function buildFarmer(overrides: Partial<User> = {}): User {
  return buildUser({ role: UserRole.FARMER, ...overrides });
}

export function buildBuyer(overrides: Partial<User> = {}): User {
  return buildUser({
    id: "buyer-abc-123",
    phone: "+233244999888",
    firstName: "Kwame",
    lastName: "Osei",
    role: UserRole.BUYER,
    email: "user_233244999888@vegelink.app",
    ...overrides,
  });
}

export function buildTransporter(overrides: Partial<User> = {}): User {
  return buildUser({
    id: "transporter-abc-123",
    phone: "+233244777666",
    firstName: "Adwoa",
    lastName: "Boateng",
    role: UserRole.TRANSPORTER,
    email: "user_233244777666@vegelink.app",
    ...overrides,
  });
}

export function buildAgent(overrides: Partial<User> = {}): User {
  return buildUser({
    id: "agent-abc-123",
    phone: "+233244555444",
    firstName: "Kofi",
    lastName: "Asante",
    role: UserRole.AGENT,
    email: "user_233244555444@vegelink.app",
    ...overrides,
  });
}

export function buildFarmerWithPayment(overrides: Partial<User> = {}): User {
  return buildFarmer({
    mobileMoneyNumber: "+233244123456",
    mobileMoneyNetwork: "mtn",
    paystackSubaccountCode: "ACCT_abc123xyz",
    paymentDetailsSet: true,
    ...overrides,
  });
}

// ── Agent assignment factory ───────────────────────────────────────────────────

export function buildAssignment(
  overrides: Partial<AgentAssignment> = {},
): AgentAssignment {
  return {
    id: "assignment-abc-123",
    agentId: "agent-abc-123",
    userId: "user-abc-123",
    isActive: true,
    assignedAt: new Date("2026-06-01T08:00:00Z"),
    unassignedAt: null,
    ...overrides,
  } as AgentAssignment;
}

// ── Rating summary factory ────────────────────────────────────────────────────

export function buildRatingSummary(averageRating = "4.50", totalRatings = "8") {
  return { averageRating, totalRatings };
}

// ── Earnings factory ──────────────────────────────────────────────────────────

export function buildEarnings(overrides: Record<string, string> = {}) {
  return {
    totalEarned: "1250.50",
    pendingSettlement: "130.54",
    settled: "1119.96",
    thisMonth: "382.00",
    thisWeek: "130.54",
    ...overrides,
  };
}
