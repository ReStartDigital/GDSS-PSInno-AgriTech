import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@vegelink/shared";
import {
  findMobileOrder,
  getConfirmationLabel,
  getStatusLabel,
  MobileOrder,
} from "@/lib/orders-data";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const order = findMobileOrder(id);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/orders");
  };

  if (!order) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Order Details" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-semibold text-gray-900">
            Order not found
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Return to the Orders tab and choose a listed order.
          </Text>
          <Pressable
            className="mt-6 rounded-2xl bg-green-800 px-5 py-3"
            onPress={handleBack}
          >
            <Text className="font-black text-white">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const primaryAction = getPrimaryAction(order, role);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Order Details" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-sm font-black uppercase text-green-700">
            {getStatusLabel(order.status)}
          </Text>
          <View className="mt-2 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-3xl font-black text-green-950">
                {order.cropName}
              </Text>
              <Text className="mt-2 text-base text-gray-600">
                {order.quantityOrdered} {order.unitOfMeasure} for {order.buyerName}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-black text-green-900">
                GHS {order.totalAmount.toFixed(2)}
              </Text>
              <Text className="text-xs text-gray-500">total</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-lg font-black text-green-950">Parties</Text>
          <InfoRow label="Buyer" value={order.buyerName} />
          <InfoRow label="Farmer" value={order.farmerName} />
          <InfoRow
            label="Transporter"
            value={order.transporterName ?? "Not assigned yet"}
          />
          <InfoRow label="Delivery" value={order.deliveryAddress} />
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-lg font-black text-green-950">Payment and handling</Text>
          <InfoRow label="Payment provider" value={order.paymentProvider} />
          <InfoRow label="Packaging" value={order.packaging} />
          <InfoRow
            label="Confirmation mode"
            value={getConfirmationLabel(order.confirmationMode)}
          />
          <InfoRow
            label="Delivery OTP"
            value={order.deliveryOtpRequired ? "Required at delivery" : "Not required yet"}
          />
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-lg font-black text-green-950">Timeline</Text>
          <View className="mt-3 gap-4">
            {order.timeline.map((event) => (
              <View key={event.title} className="flex-row gap-3">
                <View
                  className={`mt-1 h-4 w-4 rounded-full ${
                    event.done ? "bg-green-700" : "bg-gray-300"
                  }`}
                />
                <View className="flex-1">
                  <Text className="font-black text-gray-950">{event.title}</Text>
                  <Text className="mt-1 text-sm leading-5 text-gray-600">
                    {event.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {primaryAction ? (
          <Pressable
            className="mt-5 rounded-2xl bg-green-800 py-4 active:bg-green-900"
            onPress={() => Alert.alert(primaryAction.title, primaryAction.message)}
          >
            <Text className="text-center text-base font-black text-white">
              {primaryAction.label}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          className="mt-3 rounded-2xl border border-gray-300 py-4"
          onPress={handleBack}
        >
          <Text className="text-center font-black text-gray-800">
            Back to Orders
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-4 border-t border-gray-100 pt-4">
      <Text className="text-sm font-black text-gray-500">{label}</Text>
      <Text className="mt-1 text-base font-black text-gray-950">{value}</Text>
    </View>
  );
}

function getPrimaryAction(order: MobileOrder, role: string | undefined) {
  if (role === "farmer" && order.status === "pending_payment") {
    return {
      label: "Confirm Order",
      title: "Order confirmation",
      message: "Farmer confirmation is ready to be submitted.",
    };
  }

  if (role === "buyer" && order.status === "pending_payment") {
    return {
      label: "Pay with MoMo",
      title: "Payment",
      message: "Mobile money checkout is ready for this order.",
    };
  }

  if (role === "transporter" && order.status === "paid") {
    return {
      label: "Mark Picked Up",
      title: "Transport update",
      message: "Pickup status is ready to be recorded.",
    };
  }

  if (role === "transporter" && order.status === "in_transit") {
    return {
      label: "Enter Delivery OTP",
      title: "Delivery OTP",
      message: "Enter the buyer code before completing delivery.",
    };
  }

  if (role === "agent" && order.confirmationMode === "agent_proxy") {
    return {
      label: "Confirm for Farmer",
      title: "Agent confirmation",
      message: "Confirm only after the farmer gives consent.",
    };
  }

  return null;
}
