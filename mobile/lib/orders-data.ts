export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "in_transit"
  | "completed"
  | "cancelled";

export type ConfirmationMode =
  | "sms_reply"
  | "agent_proxy"
  | "pre_authorised"
  | "trusted_buyer";

export function getStatusLabel(status: OrderStatus) {
  return {
    pending_payment: "Pending payment",
    paid: "Paid",
    in_transit: "In transit",
    completed: "Completed",
    cancelled: "Cancelled",
  }[status];
}

export function getConfirmationLabel(mode: ConfirmationMode) {
  return {
    sms_reply: "SMS reply",
    agent_proxy: "Agent proxy",
    pre_authorised: "Pre-authorised",
    trusted_buyer: "Trusted buyer",
  }[mode];
}
