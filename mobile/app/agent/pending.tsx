import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Clock } from "iconoir-react-native";

export default function AgentPendingScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Pending Approvals" subtitle="Review registrations" />

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-amber-50">
          <Clock color="#F59E0B" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No pending approvals
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Pending client registrations will appear here when farmers request
          your assistance.
        </Text>
      </View>
    </View>
  );
}
