import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function AgentPendingScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Pending Approvals" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Pending client registrations will appear here.</Text>
      </View>
    </View>
  );
}
