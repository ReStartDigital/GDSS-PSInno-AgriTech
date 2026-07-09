import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@vegelink/shared";
import {
  useOrderDetails,
  useConfirmOrder,
  useDeclineOrder,
  usePackOrder,
  useCancelOrder,
  useMarkReadyForPickup,
  useVerifyPickup,
  mapBackendOrderToClient,
} from "@/lib/orders-api";
import { useRequestTransport } from "@/lib/transport-api";
import { useSubmitRating } from "@/lib/ratings-api";
import { getConfirmationLabel, getStatusLabel } from "@/lib/orders-data";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const userId = useAuthStore((state) => state.user?.id);

  // ── PIN verification modal state ─────────────────────────────────────
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [verifyPin, setVerifyPin] = useState("");

  // ── Rating modal state ───────────────────────────────────────────────
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  // ── API hooks ────────────────────────────────────────────────────────
  const { data: rawOrder, isLoading } = useOrderDetails(id || "");
  const confirmMutation = useConfirmOrder();
  const declineMutation = useDeclineOrder();
  const packMutation = usePackOrder();
  const cancelMutation = useCancelOrder();
  const readyPickupMutation = useMarkReadyForPickup();
  const verifyPickupMutation = useVerifyPickup();
  const requestTransportMutation = useRequestTransport();
  const submitRatingMutation = useSubmitRating();

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
    cancelMutation.isPending ||
    readyPickupMutation.isPending ||
    verifyPickupMutation.isPending ||
    requestTransportMutation.isPending ||
    submitRatingMutation.isPending;

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

  const handleReadyForPickup = () => {
    Alert.alert(
      "Ready for Pickup",
      "Confirm the order is packed. A 6-minute verification PIN will be sent to the buyer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send PIN",
          onPress: () =>
            readyPickupMutation.mutate(id!, {
              onSuccess: () =>
                Alert.alert(
                  "PIN Sent ✅",
                  "A 6-minute collection PIN has been sent to the buyer.",
                ),
              onError: (err: any) =>
                Alert.alert(
                  "Error",
                  err.error?.message || "Could not mark as ready for pickup.",
                ),
            }),
        },
      ],
    );
  };

  const handleOpenVerifyPickup = () => {
    setVerifyPin("");
    setPinModalVisible(true);
  };

  const handleSubmitPickupPin = () => {
    if (verifyPin.length < 4) {
      Alert.alert("Invalid PIN", "Please enter the buyer's verification code (at least 4 digits).");
      return;
    }
    verifyPickupMutation.mutate(
      { id: id!, pin: verifyPin },
      {
        onSuccess: () => {
          setPinModalVisible(false);
          setVerifyPin("");
          Alert.alert(
            "Pickup Verified ✅",
            "Order complete. The buyer has collected the produce.",
          );
        },
        onError: (err: any) => {
          Alert.alert(
            "Verification Failed",
            err.error?.message || "Invalid or expired PIN. Please try again.",
          );
        },
      },
    );
  };

  const handleRequestTransport = () => {
    // For transport requests, we need pickup/dropoff coordinates
    // Using placeholder coordinates — a real app would use the listing's farm location and buyer's delivery location
    Alert.alert(
      "Request Transport",
      "Post this order to the transport jobs board so a transporter can pick it up?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Transport",
          onPress: () =>
            requestTransportMutation.mutate(
              {
                order_id: id!,
                pickup_location: { latitude: 5.6037, longitude: -0.187 },
                dropoff_location: { latitude: 6.6666, longitude: -1.6163 },
                packaging_type_name: order.packaging || "Standard Sacks",
              },
              {
                onSuccess: () =>
                  Alert.alert(
                    "Transport Requested ✅",
                    "Your order has been posted to the jobs board. A transporter will accept it soon.",
                  ),
                onError: (err: any) =>
                  Alert.alert(
                    "Error",
                    err.error?.message || "Could not request transport.",
                  ),
              },
            ),
        },
      ],
    );
  };

  const handleOpenRating = () => {
    setRatingScore(0);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  const handleSubmitRating = () => {
    if (ratingScore < 1 || ratingScore > 5) {
      Alert.alert("Select Rating", "Please tap a star to select your rating.");
      return;
    }

    // Determine the counter-party to rate
    const rateeId =
      role === "buyer" ? order.farmerId : order.traderId;

    submitRatingMutation.mutate(
      {
        order_id: id!,
        ratee_id: rateeId,
        score: ratingScore,
        comment: ratingComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRatingModalVisible(false);
          Alert.alert("Review Submitted ✅", "Thank you for your feedback.");
        },
        onError: (err: any) => {
          Alert.alert(
            "Error",
            err.error?.message || "Could not submit rating.",
          );
        },
      },
    );
  };

  // ── Derive visible actions based on role + status ───────────────────

  const actions = getActions(order, role, {
    onConfirm: handleConfirm,
    onDecline: handleDecline,
    onPack: handlePack,
    onCancel: handleCancel,
    onReadyForPickup: handleReadyForPickup,
    onVerifyPickup: handleOpenVerifyPickup,
    onRequestTransport: handleRequestTransport,
    onRate: handleOpenRating,
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

      {/* ── PIN Verification Modal ───────────────────────────────────── */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPinModalVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-6 pb-10 pt-6"
            onPress={() => {}}
          >
            <Text className="text-xl font-black text-gray-950">
              Verify Buyer PIN
            </Text>
            <Text className="mt-2 text-base leading-6 text-gray-500">
              Enter the 6-digit code the buyer received via SMS to complete this
              pickup.
            </Text>

            <TextInput
              className="mt-5 rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 text-center text-2xl font-black tracking-[8px] text-gray-950"
              placeholder="• • • • • •"
              placeholderTextColor="#9CA3AF"
              value={verifyPin}
              onChangeText={setVerifyPin}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />

            <Pressable
              className="mt-5 rounded-2xl bg-green-700 py-4 active:opacity-80"
              disabled={verifyPickupMutation.isPending}
              onPress={handleSubmitPickupPin}
            >
              {verifyPickupMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-center text-base font-black text-white">
                  Verify & Complete
                </Text>
              )}
            </Pressable>

            <Pressable
              className="mt-3 rounded-2xl border border-gray-200 py-4"
              onPress={() => setPinModalVisible(false)}
            >
              <Text className="text-center font-black text-gray-600">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Rating Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setRatingModalVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-6 pb-10 pt-6"
            onPress={() => {}}
          >
            <Text className="text-xl font-black text-gray-950">
              Rate {role === "buyer" ? order.farmerName : order.buyerName}
            </Text>
            <Text className="mt-2 text-base leading-6 text-gray-500">
              How was your experience with this transaction?
            </Text>

            {/* Star Picker */}
            <View className="mt-5 flex-row justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  className={`h-12 w-12 items-center justify-center rounded-xl ${
                    ratingScore >= star
                      ? "bg-amber-400"
                      : "bg-gray-100"
                  }`}
                  onPress={() => setRatingScore(star)}
                >
                  <Text
                    className={`text-xl ${
                      ratingScore >= star
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="mt-2 text-center text-sm text-gray-400">
              {ratingScore > 0 ? `${ratingScore} / 5 stars` : "Tap a star"}
            </Text>

            {/* Comment */}
            <TextInput
              className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-950"
              placeholder="Optional feedback comment…"
              placeholderTextColor="#9CA3AF"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              numberOfLines={3}
              maxLength={1000}
            />

            <Pressable
              className="mt-5 rounded-2xl bg-green-700 py-4 active:opacity-80"
              disabled={submitRatingMutation.isPending || ratingScore === 0}
              onPress={handleSubmitRating}
            >
              {submitRatingMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-center text-base font-black text-white">
                  Submit Review
                </Text>
              )}
            </Pressable>

            <Pressable
              className="mt-3 rounded-2xl border border-gray-200 py-4"
              onPress={() => setRatingModalVisible(false)}
            >
              <Text className="text-center font-black text-gray-600">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    onReadyForPickup: () => void;
    onVerifyPickup: () => void;
    onRequestTransport: () => void;
    onRate: () => void;
  }
): ActionItem[] {
  const actions: ActionItem[] = [];
  const rawStatus = order.rawStatus as string;
  const mode = order.mode as string;

  // Farmer / Agent can confirm pending orders
  if (
    (role === "farmer" || role === "agent") &&
    ["pending", "pending_agent_confirmation", "pending_sms_confirmation"].includes(rawStatus)
  ) {
    actions.push({ label: "Confirm Order", onPress: handlers.onConfirm });
    actions.push({
      label: "Decline Order",
      destructive: true,
      onPress: handlers.onDecline,
    });
  }

  // Farmer / Agent can mark confirmed delivery orders as packed
  if (
    (role === "farmer" || role === "agent") &&
    rawStatus === "confirmed" &&
    mode === "delivery"
  ) {
    actions.push({ label: "Mark as Packed", onPress: handlers.onPack });
    actions.push({ label: "Request Transport", onPress: handlers.onRequestTransport });
  }

  // Farmer / Agent can trigger the pickup OTP flow for confirmed pickup orders
  if (
    (role === "farmer" || role === "agent") &&
    rawStatus === "confirmed" &&
    mode === "pickup"
  ) {
    actions.push({ label: "Ready for Pickup (Send PIN)", onPress: handlers.onReadyForPickup });
  }

  // Farmer / Agent can verify the buyer's pickup PIN when order is packed (pickup mode)
  if (
    (role === "farmer" || role === "agent") &&
    rawStatus === "packed" &&
    mode === "pickup"
  ) {
    actions.push({ label: "Verify Buyer PIN", onPress: handlers.onVerifyPickup });
  }

  // Any involved party can rate on terminal orders
  if (["delivered", "collected"].includes(rawStatus)) {
    actions.push({ label: "Rate Counter-Party ★", onPress: handlers.onRate });
  }

  // Any involved party can cancel non-completed orders
  if (
    !["delivered", "collected", "cancelled", "cancelled_expired"].includes(rawStatus)
  ) {
    // Only add cancel if we haven't already added decline above
    if (!["pending", "pending_agent_confirmation", "pending_sms_confirmation"].includes(rawStatus) || role === "buyer") {
      actions.push({
        label: "Cancel Order",
        destructive: true,
        onPress: handlers.onCancel,
      });
    }
  }

  return actions;
}
