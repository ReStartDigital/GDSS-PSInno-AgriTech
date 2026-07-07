import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@vegelink/shared";
import {
  useOrderDetails,
  useConfirmOrder,
  useDeclineOrder,
  usePackOrder,
  useCancelOrder,
  mapBackendOrderToClient,
} from "@/lib/orders-api";
import { getConfirmationLabel, getStatusLabel } from "@/lib/orders-data";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);

  const { data: rawOrder, isLoading } = useOrderDetails(id || "");
  const confirmMutation = useConfirmOrder();
  const declineMutation = useDeclineOrder();
  const packMutation = usePackOrder();
  const cancelMutation = useCancelOrder();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/orders");
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Order Details" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#15803D" />
        </View>
      </View>
    );
  }

  if (!rawOrder) {
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

  const order = mapBackendOrderToClient(rawOrder);
  const isMutating =
    confirmMutation.isPending ||
    declineMutation.isPending ||
    packMutation.isPending ||
    cancelMutation.isPending;

  // ── Action handlers ─────────────────────────────────────────────────

  const handleConfirm = () => {
    Alert.alert("Confirm Order", "Accept this order and commit the stock?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          confirmMutation.mutate(id!, {
            onSuccess: () => Alert.alert("Confirmed", "Order has been confirmed."),
            onError: (err: any) =>
              Alert.alert("Error", err.error?.message || "Could not confirm order."),
          }),
      },
    ]);
  };

  const handleDecline = () => {
    if (Alert.prompt) {
      Alert.prompt(
        "Decline Order",
        "Provide a reason for declining:",
        (reason) => {
          if (!reason || reason.length < 4) {
            Alert.alert("Validation", "Reason must be at least 4 characters.");
            return;
          }
          declineMutation.mutate(
            { id: id!, reason },
            {
              onSuccess: () => Alert.alert("Declined", "Order has been declined."),
              onError: (err: any) =>
                Alert.alert("Error", err.error?.message || "Could not decline order."),
            }
          );
        },
        "plain-text"
      );
    } else {
      Alert.alert("Decline Order", "Are you sure you want to decline this order?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () =>
            declineMutation.mutate(
              { id: id!, reason: "Farmer declined via app" },
              {
                onSuccess: () => Alert.alert("Declined", "Order has been declined."),
                onError: (err: any) =>
                  Alert.alert("Error", err.error?.message || "Could not decline order."),
              }
            ),
        },
      ]);
    }
  };

  const handlePack = () => {
    Alert.alert("Mark as Packed", "Confirm this order is packed and ready?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Packed",
        onPress: () =>
          packMutation.mutate(id!, {
            onSuccess: () => Alert.alert("Packed", "Order marked as packed."),
            onError: (err: any) =>
              Alert.alert("Error", err.error?.message || "Could not mark as packed."),
          }),
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () =>
          cancelMutation.mutate(
            { id: id!, reason: "Cancelled via mobile app" },
            {
              onSuccess: () => Alert.alert("Cancelled", "Order has been cancelled."),
              onError: (err: any) =>
                Alert.alert("Error", err.error?.message || "Could not cancel order."),
            }
          ),
      },
    ]);
  };

  // ── Derive visible actions based on role + status ───────────────────

  const actions = getActions(order, role, {
    onConfirm: handleConfirm,
    onDecline: handleDecline,
    onPack: handlePack,
    onCancel: handleCancel,
  });

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
            {order.timeline.map((event: any) => (
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

        {/* Action Buttons */}
        {actions.length > 0 && (
          <View className="mt-5 gap-3">
            {actions.map((action) => (
              <Pressable
                key={action.label}
                className={`rounded-2xl py-4 active:opacity-80 ${
                  action.destructive
                    ? "border border-red-200 bg-red-50"
                    : "bg-green-800"
                }`}
                disabled={isMutating}
                onPress={action.onPress}
              >
                {isMutating ? (
                  <ActivityIndicator
                    color={action.destructive ? "#991B1B" : "white"}
                    size="small"
                  />
                ) : (
                  <Text
                    className={`text-center text-base font-black ${
                      action.destructive ? "text-red-700" : "text-white"
                    }`}
                  >
                    {action.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

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

interface ActionItem {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

function getActions(
  order: any,
  role: string | undefined,
  handlers: {
    onConfirm: () => void;
    onDecline: () => void;
    onPack: () => void;
    onCancel: () => void;
  }
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Farmer / Agent can confirm pending orders
  if (
    (role === "farmer" || role === "agent") &&
    order.status === "pending_payment"
  ) {
    actions.push({ label: "Confirm Order", onPress: handlers.onConfirm });
    actions.push({
      label: "Decline Order",
      destructive: true,
      onPress: handlers.onDecline,
    });
  }

  // Farmer / Agent can mark confirmed orders as packed
  if (
    (role === "farmer" || role === "agent") &&
    order.status === "paid"
  ) {
    actions.push({ label: "Mark as Packed", onPress: handlers.onPack });
  }

  // Any involved party can cancel non-completed orders
  if (
    order.status !== "completed" &&
    order.status !== "cancelled"
  ) {
    // Only add cancel if we haven't already added decline above
    if (order.status !== "pending_payment" || role === "buyer") {
      actions.push({
        label: "Cancel Order",
        destructive: true,
        onPress: handlers.onCancel,
      });
    }
  }

  return actions;
}
