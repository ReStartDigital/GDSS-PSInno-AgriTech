import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function ListingOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Place Order" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Order for listing {id}</Text>
      </View>
    </View>
  );
}
