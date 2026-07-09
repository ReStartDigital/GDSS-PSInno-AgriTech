import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, TextInput, Modal, RefreshControl, ActivityIndicator } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Truck, NavArrowRight, BoxIso } from "iconoir-react-native";
import {
  useAvailableJobs,
  useAcceptJob,
  useTriggerArrival,
  useConfirmDelivery,
  mapTransportJobToClient,
  BackendTransportRequest,
} from "@/lib/transport-api";
import { useAuthStore } from "@vegelink/shared";

type TabKey = "available" | "my_jobs";

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("available");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpPin, setOtpPin] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  // Queries
  const {
    data: availableData,
    isLoading: availableLoading,
    refetch: refetchAvailable,
    isRefetching: isRefetchingAvailable,
  } = useAvailableJobs();

  // Mutations
  const acceptJobMutation = useAcceptJob();
  const triggerArrivalMutation = useTriggerArrival();
  const confirmDeliveryMutation = useConfirmDelivery();

  // Map API data into UI-friendly format
  const rawJobs: BackendTransportRequest[] = availableData?.data || [];
  const allJobs = rawJobs.map(mapTransportJobToClient);
  const openJobs = allJobs.filter((j) => j.status === "open");
  const myJobs = allJobs.filter(
    (j) =>
      j.transporterId === user?.id &&
      ["accepted", "in_transit", "en_route"].includes(j.status),
  );

  const handleAccept = (job: ReturnType<typeof mapTransportJobToClient>) => {
    Alert.alert(
      "Accept Job?",
      `Deliver ${job.quantityText} of ${job.cropName} from ${job.pickupAddress} to ${job.deliveryAddress} for GHC${job.payoutGhs.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            acceptJobMutation.mutate(job.id, {
              onSuccess: () => {
                Alert.alert(
                  "Job Accepted ✅",
                  "You can now pick up the produce from the farmer.",
                );
                refetchAvailable();
              },
              onError: (err: any) =>
                Alert.alert(
                  "Error",
                  err.error?.message || "Could not accept job.",
                ),
            });
          },
        },
      ],
    );
  };

  const handleArrival = (job: ReturnType<typeof mapTransportJobToClient>) => {
    Alert.alert(
      "Arrived at Doorstep?",
      "Confirm that you have arrived at the buyer's location. A 6-minute verification code will be sent to the buyer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I've Arrived",
          onPress: () => {
            triggerArrivalMutation.mutate(job.id, {
              onSuccess: () => {
                Alert.alert(
                  "Arrival Registered ✅",
                  "A verification PIN has been sent to the buyer. Ask them for the code.",
                );
                refetchAvailable();
              },
              onError: (err: any) =>
                Alert.alert(
                  "Error",
                  err.error?.message || "Could not register arrival.",
                ),
            });
          },
        },
      ],
    );
  };

  const handleStartDeliveryVerification = (
    job: ReturnType<typeof mapTransportJobToClient>,
  ) => {
    setActiveJobId(job.id);
    setOtpPin("");
    setOtpModalVisible(true);
  };

  const handleSubmitDeliveryOtp = () => {
    if (!activeJobId || otpPin.length < 4) {
      Alert.alert("Invalid PIN", "Please enter the buyer's verification code (at least 4 digits).");
      return;
    }
    confirmDeliveryMutation.mutate(
      { transportRequestId: activeJobId, pin: otpPin },
      {
        onSuccess: () => {
          setOtpModalVisible(false);
          setOtpPin("");
          setActiveJobId(null);
          Alert.alert(
            "Delivery Complete ✅",
            "Delivery verified. Payment will be credited to your account.",
          );
          refetchAvailable();
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

  const isMutating =
    acceptJobMutation.isPending ||
    triggerArrivalMutation.isPending ||
    confirmDeliveryMutation.isPending;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Transport Jobs" subtitle="Find deliveries near you" />

      {/* Tabs */}
      <View className="flex-row gap-3 px-5 pb-4">
        <TabPill
          label="Available"
          count={openJobs.length}
          active={activeTab === "available"}
          onPress={() => setActiveTab("available")}
        />
        <TabPill
          label="My Jobs"
          count={myJobs.length}
          active={activeTab === "my_jobs"}
          onPress={() => setActiveTab("my_jobs")}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingAvailable}
            onRefresh={refetchAvailable}
            tintColor="#2563EB"
          />
        }
      >
        {availableLoading ? (
          <View className="items-center pt-20">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-4 text-base text-gray-500">Loading jobs…</Text>
          </View>
        ) : activeTab === "available" ? (
          <>
            {openJobs.length === 0 ? (
              <EmptyState
                icon={
                  <Truck
                    color="#2563EB"
                    width={44}
                    height={44}
                    strokeWidth={1.5}
                  />
                }
                title="No jobs available"
                message="Available transport jobs will appear here when buyers need deliveries in your area."
              />
            ) : (
              <View className="gap-4">
                {openJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    actionLabel="Accept Job"
                    actionColor="blue"
                    onAction={() => handleAccept(job)}
                    disabled={isMutating}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {myJobs.length === 0 ? (
              <EmptyState
                icon={
                  <BoxIso
                    color="#6B7280"
                    width={44}
                    height={44}
                    strokeWidth={1.5}
                  />
                }
                title="No active jobs"
                message="Jobs you accept will appear here. Go to Available to pick up a delivery."
              />
            ) : (
              <View className="gap-4">
                {myJobs.map((job) => {
                  const isAccepted = job.status === "accepted";
                  const isEnRoute = job.status === "en_route";
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      actionLabel={
                        isAccepted
                          ? "I've Arrived"
                          : isEnRoute
                          ? "Verify Delivery"
                          : "In Transit"
                      }
                      actionColor={isAccepted ? "amber" : "green"}
                      onAction={() =>
                        isAccepted
                          ? handleArrival(job)
                          : handleStartDeliveryVerification(job)
                      }
                      disabled={isMutating}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOtpModalVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-6 pb-10 pt-6"
            onPress={() => {}}
          >
            <Text className="text-xl font-black text-gray-950">
              Verify Delivery
            </Text>
            <Text className="mt-2 text-base leading-6 text-gray-500">
              Enter the 6-digit PIN the buyer received via SMS to complete this
              delivery.
            </Text>

            <TextInput
              className="mt-5 rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 text-center text-2xl font-black tracking-[8px] text-gray-950"
              placeholder="• • • • • •"
              placeholderTextColor="#9CA3AF"
              value={otpPin}
              onChangeText={setOtpPin}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />

            <Pressable
              className="mt-5 rounded-2xl bg-green-700 py-4 active:opacity-80"
              disabled={confirmDeliveryMutation.isPending}
              onPress={handleSubmitDeliveryOtp}
            >
              {confirmDeliveryMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-center text-base font-black text-white">
                  Confirm Delivery
                </Text>
              )}
            </Pressable>

            <Pressable
              className="mt-3 rounded-2xl border border-gray-200 py-4"
              onPress={() => setOtpModalVisible(false)}
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

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function TabPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-row items-center gap-2 rounded-2xl px-5 py-3 ${
        active ? "bg-gray-900" : "bg-white border border-gray-200"
      }`}
      onPress={onPress}
    >
      <Text className={`text-sm font-black ${active ? "text-white" : "text-gray-600"}`}>
        {label}
      </Text>
      {count > 0 && (
        <View className={`h-5 min-w-5 items-center justify-center rounded-full px-1.5 ${
          active ? "bg-white" : "bg-gray-100"
        }`}>
          <Text className={`text-[10px] font-black ${active ? "text-gray-900" : "text-gray-600"}`}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function JobCard({
  job,
  actionLabel,
  actionColor,
  onAction,
  disabled,
}: {
  job: ReturnType<typeof mapTransportJobToClient>;
  actionLabel: string;
  actionColor: "blue" | "amber" | "green";
  onAction: () => void;
  disabled?: boolean;
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: "bg-blue-100", text: "text-blue-700", label: "Open" },
    accepted: { bg: "bg-amber-100", text: "text-amber-700", label: "Accepted" },
    in_transit: { bg: "bg-orange-100", text: "text-orange-700", label: "In Transit" },
    en_route: { bg: "bg-purple-100", text: "text-purple-700", label: "At Doorstep" },
    delivered: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
  };

  const actionBg: Record<string, string> = {
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    green: "bg-green-700",
  };

  const st = statusColors[job.status] || statusColors.open;

  return (
    <View className="rounded-3xl border border-gray-100 bg-white p-5">
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-black text-gray-950">{job.cropName}</Text>
          <Text className="mt-1 text-sm font-semibold text-gray-500">
            {job.quantityText} · {job.distanceKm.toFixed(1)} km
          </Text>
        </View>
        <View className={`rounded-xl px-3 py-1.5 ${st.bg}`}>
          <Text className={`text-xs font-black ${st.text}`}>{st.label}</Text>
        </View>
      </View>

      {/* Route */}
      <View className="mt-4 rounded-2xl bg-gray-50 p-4">
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5 items-center">
            <View className="h-3 w-3 rounded-full bg-green-500" />
            <View className="my-1 h-6 w-0.5 bg-gray-300" />
            <View className="h-3 w-3 rounded-full bg-red-500" />
          </View>
          <View className="flex-1">
            <View>
              <Text className="text-[10px] font-black uppercase text-gray-400">Pickup</Text>
              <Text className="mt-0.5 text-sm font-semibold text-gray-800" numberOfLines={1}>
                {job.pickupAddress}
              </Text>
              <Text className="text-xs text-gray-500">From: {job.farmerName}</Text>
            </View>
            <View className="mt-3">
              <Text className="text-[10px] font-black uppercase text-gray-400">Deliver to</Text>
              <Text className="mt-0.5 text-sm font-semibold text-gray-800" numberOfLines={1}>
                {job.deliveryAddress}
              </Text>
              <Text className="text-xs text-gray-500">To: {job.buyerName}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payout & Action */}
      <View className="mt-4 flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-black uppercase text-gray-400">Payout</Text>
          <Text className="text-xl font-black text-gray-950">
            GHC{job.payoutGhs.toFixed(2)}
          </Text>
        </View>
        <Pressable
          className={`flex-row items-center gap-2 rounded-2xl px-5 py-3.5 ${actionBg[actionColor]} ${disabled ? "opacity-50" : ""}`}
          onPress={onAction}
          disabled={disabled}
        >
          <Text className="text-sm font-black text-white">{actionLabel}</Text>
          <NavArrowRight color="#FFFFFF" width={16} height={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <View className="items-center px-8 pt-20">
      <View className="h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">
        {icon}
      </View>
      <Text className="mt-6 text-center text-xl font-black text-gray-950">
        {title}
      </Text>
      <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
        {message}
      </Text>
    </View>
  );
}
