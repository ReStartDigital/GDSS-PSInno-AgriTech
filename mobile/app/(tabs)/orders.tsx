import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@vegelink/shared";
import {
  getConfirmationLabel,
  getOrdersForRole,
  getStatusLabel,
  MobileOrder,
  OrderStatus,
} from "@/lib/orders-data";

export default function OrdersScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const orders = getOrdersForRole(role);
  const openOrders = orders.filter((order) => order.status !== "completed").length;
  const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Orders" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="rounded-lg border border-green-100 bg-green-50 p-4">
          <Text className="text-sm font-semibold uppercase text-green-700">
            Order lifecycle
          </Text>
          <Text className="mt-2 text-3xl font-black text-green-950">
            Track every step
          </Text>
          <Text className="mt-2 text-base leading-6 text-green-900">
            Follow confirmation, Paystack payment, transport assignment, and
            delivery OTP status from one place.
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2">
          <SummaryTile label="Orders" value={String(orders.length)} />
          <SummaryTile label="Open" value={String(openOrders)} />
          <SummaryTile label="Value" value={`GHS ${totalValue.toFixed(0)}`} />
        </View>

        <View className="mt-5 gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-lg border border-gray-200 bg-white p-3">
      <Text className="text-xs font-semibold text-gray-500">{label}</Text>
      <Text className="mt-1 text-base font-black text-gray-950">{value}</Text>
    </View>
  );
}

function OrderCard({ order }: { order: MobileOrder }) {
  return (
    <Link href={`/orders/${order.id}`} asChild>
      <Pressable className="rounded-lg border border-gray-200 bg-white p-4 active:bg-green-50">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-black text-green-950">
              {order.cropName}
            </Text>
            <Text className="mt-1 text-sm text-gray-600">
              {order.quantityOrdered} {order.unitOfMeasure} - {order.buyerName}
            </Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
          <View>
            <Text className="text-xs font-semibold text-gray-500">Total</Text>
            <Text className="mt-1 font-black text-gray-950">
              GHS {order.totalAmount.toFixed(2)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs font-semibold text-gray-500">
              Confirmation
            </Text>
            <Text className="mt-1 font-semibold text-green-800">
              {getConfirmationLabel(order.confirmationMode)}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-sm text-gray-600">
          Updated {order.updatedAtLabel}
        </Text>
      </Pressable>
    </Link>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = {
    pending_payment: "bg-amber-50 text-amber-800",
    paid: "bg-green-50 text-green-800",
    in_transit: "bg-blue-50 text-blue-800",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-50 text-red-800",
  }[status];

  const [containerClassName, textClassName] = tone.split(" ");

  return (
    <View className={`rounded-full px-3 py-1 ${containerClassName}`}>
      <Text className={`text-xs font-bold ${textClassName}`}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}
