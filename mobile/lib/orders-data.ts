import { UserRole } from "@vegelink/shared";

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

export interface MobileOrder {
  id: string;
  listingId: string;
  cropName: string;
  quantityOrdered: number;
  unitOfMeasure: string;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  traderId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  transporterName?: string;
  confirmationMode: ConfirmationMode;
  paymentProvider: "MTN MoMo" | "Telecel Cash" | "AT Money";
  packaging: string;
  deliveryOtpRequired: boolean;
  createdAtLabel: string;
  updatedAtLabel: string;
  timeline: { title: string; detail: string; done: boolean }[];
}

export const mobileOrders: MobileOrder[] = [
  {
    id: "order-tomatoes-east-legon",
    listingId: "listing-roma-tomatoes",
    cropName: "Roma Tomatoes",
    quantityOrdered: 30,
    unitOfMeasure: "kg",
    totalAmount: 406,
    status: "paid",
    deliveryAddress: "East Legon restaurant kitchen, Lagos Avenue",
    traderId: "buyer-ama-restaurant",
    buyerName: "Ama Restaurant",
    farmerId: "farmer-abena-mensah",
    farmerName: "Abena Mensah Farms",
    transporterName: "Kofi Mensah Truck",
    confirmationMode: "sms_reply",
    paymentProvider: "MTN MoMo",
    packaging: "Ventilated crates",
    deliveryOtpRequired: true,
    createdAtLabel: "Today, 9:20 AM",
    updatedAtLabel: "Today, 10:05 AM",
    timeline: [
      {
        title: "Order placed",
        detail: "Buyer requested 30 kg of Roma Tomatoes.",
        done: true,
      },
      {
        title: "Farmer confirmed",
        detail: "Confirmed by YES reply from farmer SMS.",
        done: true,
      },
      {
        title: "Payment confirmed",
        detail: "Paystack MoMo payment is recorded.",
        done: true,
      },
      {
        title: "Transport assigned",
        detail: "Waiting for pickup update from transporter.",
        done: false,
      },
    ],
  },
  {
    id: "order-okra-osu",
    listingId: "listing-green-okra",
    cropName: "Green Okra",
    quantityOrdered: 18,
    unitOfMeasure: "kg",
    totalAmount: 231,
    status: "in_transit",
    deliveryAddress: "Osu Oxford Street market stall 14",
    traderId: "buyer-kwame-market",
    buyerName: "Kwame Market Supplies",
    farmerId: "farmer-fatima-issah",
    farmerName: "Fatima Issah Farm",
    transporterName: "Adjei Logistics",
    confirmationMode: "trusted_buyer",
    paymentProvider: "Telecel Cash",
    packaging: "Ventilated crates",
    deliveryOtpRequired: true,
    createdAtLabel: "Today, 7:45 AM",
    updatedAtLabel: "Today, 11:18 AM",
    timeline: [
      {
        title: "Auto-confirmed",
        detail: "Trusted buyer guardrails matched this order.",
        done: true,
      },
      {
        title: "Payment confirmed",
        detail: "Buyer paid through Telecel Cash.",
        done: true,
      },
      {
        title: "Picked up",
        detail: "Transporter marked produce as in transit.",
        done: true,
      },
      {
        title: "Delivery OTP",
        detail: "Buyer OTP needed before completion.",
        done: false,
      },
    ],
  },
  {
    id: "order-cabbage-madina",
    listingId: "listing-green-cabbage",
    cropName: "Green Cabbage",
    quantityOrdered: 60,
    unitOfMeasure: "head",
    totalAmount: 443,
    status: "pending_payment",
    deliveryAddress: "Madina wholesale lane, shop B12",
    traderId: "buyer-madina-foods",
    buyerName: "Madina Foods",
    farmerId: "farmer-kojo-asare",
    farmerName: "Kojo Asare Gardens",
    confirmationMode: "agent_proxy",
    paymentProvider: "AT Money",
    packaging: "Plastic baskets",
    deliveryOtpRequired: false,
    createdAtLabel: "Yesterday, 4:12 PM",
    updatedAtLabel: "Yesterday, 4:20 PM",
    timeline: [
      {
        title: "Agent notified",
        detail: "Assigned agent is confirming with farmer.",
        done: true,
      },
      {
        title: "Farmer consent",
        detail: "Waiting for agent confirmation in app.",
        done: false,
      },
      {
        title: "Payment",
        detail: "Buyer will pay after confirmation.",
        done: false,
      },
    ],
  },
  {
    id: "order-yam-tema",
    listingId: "listing-white-yam",
    cropName: "White Yam",
    quantityOrdered: 100,
    unitOfMeasure: "kg",
    totalAmount: 1690,
    status: "completed",
    deliveryAddress: "Tema Community 1 cold room",
    traderId: "buyer-tema-kitchen",
    buyerName: "Tema Kitchen Depot",
    farmerId: "farmer-seidu-alhassan",
    farmerName: "Seidu Alhassan Agro",
    transporterName: "Nii Freight",
    confirmationMode: "pre_authorised",
    paymentProvider: "MTN MoMo",
    packaging: "Bulk sacks",
    deliveryOtpRequired: true,
    createdAtLabel: "Mon, 2:10 PM",
    updatedAtLabel: "Mon, 6:48 PM",
    timeline: [
      {
        title: "Pre-authorised",
        detail: "Listing rules allowed instant confirmation.",
        done: true,
      },
      {
        title: "Payment confirmed",
        detail: "MoMo payment settled through Paystack.",
        done: true,
      },
      {
        title: "Delivered",
        detail: "Buyer OTP verified on delivery.",
        done: true,
      },
    ],
  },
];

export function findMobileOrder(id: string | undefined) {
  return mobileOrders.find((order) => order.id === id);
}

export function getOrdersForRole(role: UserRole | undefined) {
  if (role === "buyer") {
    return mobileOrders.filter((order) =>
      ["order-tomatoes-east-legon", "order-okra-osu", "order-yam-tema"].includes(
        order.id,
      ),
    );
  }

  if (role === "farmer") {
    return mobileOrders.filter((order) =>
      ["order-tomatoes-east-legon", "order-cabbage-madina"].includes(order.id),
    );
  }

  if (role === "transporter") {
    return mobileOrders.filter((order) =>
      ["order-okra-osu", "order-yam-tema", "order-tomatoes-east-legon"].includes(
        order.id,
      ),
    );
  }

  if (role === "agent") {
    return mobileOrders.filter((order) => order.confirmationMode === "agent_proxy");
  }

  return mobileOrders;
}

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
