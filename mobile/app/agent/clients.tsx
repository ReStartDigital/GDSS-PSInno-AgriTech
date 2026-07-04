import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { User } from "iconoir-react-native";

export default function AgentClientsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="My Clients" subtitle="Farmers you represent" />

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-purple-50">
          <User color="#7C3AED" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No clients yet
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Assigned farmer clients will appear here once you start managing
          their accounts.
        </Text>
      </View>
    </View>
  );
}
