import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { UserRole, useAuthStore } from "@vegelink/shared";

type DashboardAction = {
  label: string;
  detail: string;
  href:
    | "/(tabs)/marketplace"
    | "/(tabs)/listings"
    | "/(tabs)/orders"
    | "/(tabs)/jobs"
    | "/listings/new"
    | "/agent/clients"
    | "/agent/pending";
};

type DashboardContent = {
  title: string;
  subtitle: string;
  heroMetric: string;
  heroLabel: string;
  accent: string;
  tint: string;
  stats: { label: string; value: string }[];
  actions: DashboardAction[];
  checklist: string[];
};

const dashboardByRole: Record<UserRole, DashboardContent> = {
  buyer: {
    title: "Buy fresh produce",
    subtitle: "Find nearby farmers, prepare orders, and pay with mobile money.",
    heroMetric: "5",
    heroLabel: "active listings near Accra",
    accent: "#92400E",
    tint: "#FFF7ED",
    stats: [
      { label: "Avg. delivery", value: "Same day" },
      { label: "Payment", value: "MoMo ready" },
      { label: "Packaging", value: "Quoted" },
    ],
    actions: [
      {
        label: "Browse marketplace",
        detail: "Search crops, farmers, price, stock, and distance.",
        href: "/(tabs)/marketplace",
      },
      {
        label: "Track orders",
        detail: "See payment, confirmation, and transport status.",
        href: "/(tabs)/orders",
      },
    ],
    checklist: [
      "Compare produce by stock, price, and pickup town.",
      "Choose quantity, packaging, transport, and MoMo provider.",
      "Wait for farmer confirmation before delivery starts.",
    ],
  },
  farmer: {
    title: "Manage your harvest",
    subtitle: "List produce, confirm orders, and keep buyers updated.",
    heroMetric: "GHS 382",
    heroLabel: "sample confirmed value today",
    accent: "#15803D",
    tint: "#F0FDF4",
    stats: [
      { label: "Listings", value: "3 active" },
      { label: "Confirmations", value: "SMS/App" },
      { label: "Payout", value: "MoMo" },
    ],
    actions: [
      {
        label: "Create listing",
        detail: "Add crop, quantity, price, photo, and GPS pickup point.",
        href: "/listings/new",
      },
      {
        label: "My listings",
        detail: "Review available, pending delivery, and sold produce.",
        href: "/(tabs)/listings",
      },
      {
        label: "Orders",
        detail: "Confirm, decline, or review buyer order requests.",
        href: "/(tabs)/orders",
      },
    ],
    checklist: [
      "Keep available quantity current to avoid overselling.",
      "Use recommended packaging to reduce post-harvest losses.",
      "Confirm orders quickly or rely on SMS and agent fallback.",
    ],
  },
  transporter: {
    title: "Move produce safely",
    subtitle: "Accept nearby jobs and update delivery progress in the field.",
    heroMetric: "15 km",
    heroLabel: "matching radius for nearby jobs",
    accent: "#1D4ED8",
    tint: "#EFF6FF",
    stats: [
      { label: "Jobs", value: "4 nearby" },
      { label: "Rate", value: "GHS 2.50/km" },
      { label: "Updates", value: "Live status" },
    ],
    actions: [
      {
        label: "View jobs",
        detail: "See pickup, dropoff, packaging notes, and distance.",
        href: "/(tabs)/jobs",
      },
      {
        label: "Orders",
        detail: "Update pickup, in-transit, and delivered statuses.",
        href: "/(tabs)/orders",
      },
    ],
    checklist: [
      "Check packaging notes before loading.",
      "Update status at pickup and in transit.",
      "Use buyer delivery OTP before marking delivered.",
    ],
  },
  agent: {
    title: "Support field clients",
    subtitle: "Help farmers onboard, create listings, and confirm orders.",
    heroMetric: "6 PM",
    heroLabel: "daily farmer digest target",
    accent: "#6D28D9",
    tint: "#F5F3FF",
    stats: [
      { label: "Clients", value: "8 farmers" },
      { label: "Pending", value: "3 orders" },
      { label: "Fallback", value: "SMS safe" },
    ],
    actions: [
      {
        label: "My clients",
        detail: "View assigned farmers and assisted registrations.",
        href: "/agent/clients",
      },
      {
        label: "Pending approvals",
        detail: "Confirm orders on behalf of assigned farmers.",
        href: "/agent/pending",
      },
      {
        label: "Orders",
        detail: "Review order status and buyer requests.",
        href: "/(tabs)/orders",
      },
    ],
    checklist: [
      "Only act for farmers assigned to you.",
      "Confirm orders after farmer consent.",
      "Remind farmers they can block unsafe confirmations by SMS.",
    ],
  },
  admin: {
    title: "Platform overview",
    subtitle: "Monitor marketplace activity, orders, and fulfilment readiness.",
    heroMetric: "MVP",
    heroLabel: "mobile flow in progress",
    accent: "#374151",
    tint: "#F3F4F6",
    stats: [
      { label: "Roles", value: "5" },
      { label: "Modules", value: "8" },
      { label: "Security", value: "RBAC" },
    ],
    actions: [
      {
        label: "Orders",
        detail: "Review order lifecycle examples.",
        href: "/(tabs)/orders",
      },
      {
        label: "Browse marketplace",
        detail: "Inspect listing presentation and buyer flow.",
        href: "/(tabs)/marketplace",
      },
    ],
    checklist: [
      "Validate role-specific tabs and navigation.",
      "Review readiness for REST API and WebSocket wiring.",
      "Keep mobile slices small and committed locally.",
    ],
  },
};

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "buyer";
  const content = dashboardByRole[role];
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Home" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View
          className="rounded-lg border border-gray-200 p-4"
          style={{ backgroundColor: content.tint }}
        >
          <Text className="text-sm font-semibold uppercase text-gray-700">
            Welcome, {firstName}
          </Text>
          <Text className="mt-2 text-3xl font-black text-green-950">
            {content.title}
          </Text>
          <Text className="mt-2 text-base leading-6 text-gray-700">
            {content.subtitle}
          </Text>
          <View className="mt-5 rounded-lg bg-white p-4">
            <Text className="text-4xl font-black" style={{ color: content.accent }}>
              {content.heroMetric}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-gray-700">
              {content.heroLabel}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          {content.stats.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 rounded-lg border border-gray-200 bg-white p-3"
            >
              <Text className="text-xs font-semibold text-gray-500">
                {stat.label}
              </Text>
              <Text className="mt-1 text-base font-black text-gray-950">
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-lg font-bold text-green-950">
          Next actions
        </Text>
        <View className="mt-3 gap-3">
          {content.actions.map((action) => (
            <Link key={action.label} href={action.href} asChild>
              <Pressable className="rounded-lg border border-gray-200 bg-white p-4 active:bg-green-50">
                <View className="flex-row items-center justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-950">
                      {action.label}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-gray-600">
                      {action.detail}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-green-800">{">"}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>

        <View className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Text className="text-lg font-bold text-amber-950">
            Today&apos;s checklist
          </Text>
          <View className="mt-3 gap-3">
            {content.checklist.map((item) => (
              <View key={item} className="flex-row gap-3">
                <View className="mt-1.5 h-2 w-2 rounded-full bg-amber-700" />
                <Text className="flex-1 text-sm leading-5 text-amber-950">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
