import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Order Details" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Order ID: {id}</Text>
      </View>
    </View>
  );
}
