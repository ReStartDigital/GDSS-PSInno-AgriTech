import {
  OrderStatus,
  FulfilmentMode,
} from "../../common/constants/roles.enums.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { ConflictException } from "../../common/exceptions/index.js";

/**
 * Every valid (from → to) transition in the system.
 * Any transition not listed here is forbidden.
 *
 * Transitions are enforced in the service layer. The state machine lives
 * here so it can be unit-tested in complete isolation from DB and HTTP.
 */
const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  // Buyer places order — routes to the correct confirmation mode
  [OrderStatus.PENDING]: [
    OrderStatus.PENDING_AGENT_CONFIRMATION,
    OrderStatus.PENDING_SMS_CONFIRMATION,
    OrderStatus.CONFIRMED, // auto-confirm (pre-auth or trusted buyer)
    OrderStatus.NEGOTIATING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PENDING_AGENT_CONFIRMATION]: [
    OrderStatus.CONFIRMED,
    OrderStatus.NEGOTIATING,
    OrderStatus.CANCELLED,
    OrderStatus.FARMER_DISPUTED,
  ],

  [OrderStatus.PENDING_SMS_CONFIRMATION]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
    OrderStatus.CANCELLED_EXPIRED,
  ],

  [OrderStatus.NEGOTIATING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],

  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],

  [OrderStatus.PACKED]: [
    OrderStatus.IN_TRANSIT, // delivery: transporter picks up
    OrderStatus.COLLECTED, // pickup: buyer collects (OTP verified)
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],

  // Terminal statuses — no further transitions allowed
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.COLLECTED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.CANCELLED_EXPIRED]: [],
  [OrderStatus.FARMER_DISPUTED]: [OrderStatus.CANCELLED, OrderStatus.CONFIRMED],
};

/**
 * Validates and returns the transition, or throws a ConflictException.
 * Call this before every status update — never update status directly.
 */
export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictException(
      `Cannot transition order from "${from}" to "${to}".`,
      ErrorCode.ORDER_INVALID_TRANSITION,
    );
  }
}

/** Returns true if the order is in a terminal state (no more transitions possible). */
export function isTerminal(status: OrderStatus): boolean {
  const allowed = TRANSITIONS[status] ?? [];
  return allowed.length === 0;
}

/** Returns true if the order can still be cancelled by a party. */
export function isCancellable(status: OrderStatus): boolean {
  const allowed = TRANSITIONS[status] ?? [];
  return allowed.includes(OrderStatus.CANCELLED);
}

/**
 * Derives the first status an order should enter after placement,
 * based on the farmer's confirmation mode.
 */
export function resolveInitialStatus(
  confirmationMode: "agent" | "auto" | "sms_reply" | "trusted_buyer",
): OrderStatus {
  switch (confirmationMode) {
    case "auto":
    case "trusted_buyer":
      return OrderStatus.CONFIRMED;
    case "agent":
      return OrderStatus.PENDING_AGENT_CONFIRMATION;
    case "sms_reply":
    default:
      return OrderStatus.PENDING_SMS_CONFIRMATION;
  }
}

/**
 * Returns the correct "packed → next" transition for a given fulfilment mode.
 * Delivery: packed → in_transit (via transporter)
 * Pickup:   packed → collected (via buyer OTP)
 */
export function resolvePackedNextStatus(
  fulfilmentMode: FulfilmentMode,
): OrderStatus {
  return fulfilmentMode === FulfilmentMode.PICKUP
    ? OrderStatus.COLLECTED
    : OrderStatus.IN_TRANSIT;
}
