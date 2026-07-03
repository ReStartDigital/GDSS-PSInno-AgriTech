import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function AgentClientsScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="My Clients" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Assigned farmer clients will appear here.</Text>
      </View>
    </View>
  );
}
