import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function OrdersScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Orders" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Your orders will appear here.</Text>
      </View>
    </View>
  );
}
