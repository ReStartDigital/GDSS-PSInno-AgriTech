import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Truck, NavArrowRight, BoxIso } from "iconoir-react-native";
import { useTransportStore, TransportJob } from "@/lib/transport-store";
import { useAuthStore } from "@vegelink/shared";

type TabKey = "available" | "my_jobs";

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("available");
  const jobs = useTransportStore((s) => s.jobs);
  const acceptJob = useTransportStore((s) => s.acceptJob);
  const startTransit = useTransportStore((s) => s.startTransit);
  const completeJob = useTransportStore((s) => s.completeJob);
  const user = useAuthStore((s) => s.user);

  const openJobs = jobs.filter((j) => j.status === "open");
  const myJobs = jobs.filter(
    (j) => j.transporterId === user?.id && ["accepted", "in_transit"].includes(j.status)
  );

  const handleAccept = (job: TransportJob) => {
    Alert.alert(
      "Accept Job?",
      `Deliver ${job.quantityText} of ${job.cropName} from ${job.pickupAddress} to ${job.deliveryAddress} for GHC${job.payoutGhs.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            acceptJob(job.orderId, user?.id || "", user?.fullName || "Transporter");
            Alert.alert("Job Accepted ✅", "You can now pick up the produce from the farmer.");
          },
        },
      ]
    );
  };

  const handleStartTransit = (job: TransportJob) => {
    Alert.alert(
      "Start Transit?",
      "Confirm that you have picked up the produce and are heading to the delivery location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => startTransit(job.orderId),
        },
      ]
    );
  };

  const handleComplete = (job: TransportJob) => {
    Alert.alert(
      "Complete Delivery?",
      "Confirm that you have delivered the produce to the buyer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            completeJob(job.orderId);
            Alert.alert("Delivery Complete ✅", `GHC${job.payoutGhs.toFixed(2)} will be credited to your account.`);
          },
        },
      ]
    );
  };

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
      >
        {activeTab === "available" && (
          <>
            {openJobs.length === 0 ? (
              <EmptyState
                icon={<Truck color="#2563EB" width={44} height={44} strokeWidth={1.5} />}
                title="No jobs available"
                message="Available transport jobs will appear here when buyers need deliveries in your area."
              />
            ) : (
              <View className="gap-4">
                {openJobs.map((job) => (
                  <JobCard
                    key={job.orderId}
                    job={job}
                    actionLabel="Accept Job"
                    actionColor="blue"
                    onAction={() => handleAccept(job)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "my_jobs" && (
          <>
            {myJobs.length === 0 ? (
              <EmptyState
                icon={<BoxIso color="#6B7280" width={44} height={44} strokeWidth={1.5} />}
                title="No active jobs"
                message="Jobs you accept will appear here. Go to Available to pick up a delivery."
              />
            ) : (
              <View className="gap-4">
                {myJobs.map((job) => (
                  <JobCard
                    key={job.orderId}
                    job={job}
                    actionLabel={job.status === "accepted" ? "Start Transit" : "Complete Delivery"}
                    actionColor={job.status === "accepted" ? "amber" : "green"}
                    onAction={() =>
                      job.status === "accepted"
                        ? handleStartTransit(job)
                        : handleComplete(job)
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
}: {
  job: TransportJob;
  actionLabel: string;
  actionColor: "blue" | "amber" | "green";
  onAction: () => void;
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: "bg-blue-100", text: "text-blue-700", label: "Open" },
    accepted: { bg: "bg-amber-100", text: "text-amber-700", label: "Accepted" },
    in_transit: { bg: "bg-orange-100", text: "text-orange-700", label: "In Transit" },
    completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
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
            {job.quantityText}
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
          className={`flex-row items-center gap-2 rounded-2xl px-5 py-3.5 ${actionBg[actionColor]}`}
          onPress={onAction}
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
