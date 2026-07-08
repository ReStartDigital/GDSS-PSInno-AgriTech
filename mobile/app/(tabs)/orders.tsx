import { Link, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { vlClassNames } from "@/lib/design-system";
import { BoxIso, Shop, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrders, mapBackendOrderToClient } from "@/lib/orders-api";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending_payment: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  paid:            { bg: "#DCFCE7", text: "#166534", label: "Paid" },
  in_transit:      { bg: "#DBEAFE", text: "#1D4ED8", label: "In Transit" },
  completed:       { bg: "#F0FDF4", text: "#15803D", label: "Completed" },
  cancelled:       { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: ordersData, isLoading, isFetching, refetch } = useOrders();

  const rawOrders = ordersData?.data || [];
  const orders = rawOrders.map(mapBackendOrderToClient);

  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="bg-white px-5 pb-5 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Text className="text-3xl font-black text-gray-950">My Orders</Text>
        <Text className="mt-1 text-sm font-black text-gray-400">
          {orders.length > 0
            ? `${orders.length} order${orders.length !== 1 ? "s" : ""} · Track your produce deliveries`
            : "Track your produce deliveries"}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#15803D" />
        </View>
      ) : orders.length === 0 ? (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#15803D" />
          }
        >
          <View className="flex-1 items-center px-8 pt-20">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
              <BoxIso color="#166534" width={44} height={44} strokeWidth={1.5} />
            </View>

            <Text className="mt-6 text-center text-xl font-black text-gray-950">
              No orders yet
            </Text>
            <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
              Your produce orders will appear here. Start browsing to place your first
              order.
            </Text>

            <Link href="/(tabs)/marketplace" asChild>
              <Pressable className="mt-7 h-14 w-56 flex-row items-center justify-center gap-2 rounded-2xl bg-green-800 shadow-lg active:bg-green-900">
                <Shop color="#FFFFFF" width={20} height={20} strokeWidth={2} />
                <Text className={vlClassNames.primaryButtonText}>Browse Produce</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-5 pb-12 gap-3"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#15803D" />
          }
        >
          {orders.map((order) => {
            const sc = statusColors[order.status] || statusColors.pending_payment;
            return (
              <Pressable
                key={order.id}
                className="rounded-2xl bg-white border border-gray-100 p-4 active:opacity-80 shadow-sm"
                onPress={() => router.push(`/orders/${order.id}`)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-gray-950">
                      {order.cropName}
                    </Text>
                    <Text className="mt-0.5 text-sm font-semibold text-gray-500">
                      {order.quantityOrdered} {order.unitOfMeasure} · {order.buyerName}
                    </Text>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <Text
                      className="text-xs font-black"
                      style={{ color: sc.text }}
                    >
                      {sc.label}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text className="text-lg font-black text-green-800">
                    GH₵{order.totalAmount.toFixed(2)}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-semibold text-gray-400">
                      {order.createdAtLabel}
                    </Text>
                    <NavArrowRight color="#9CA3AF" width={14} height={14} strokeWidth={2} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
