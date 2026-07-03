import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function ListingsScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="My Listings" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Your produce listings will appear here.</Text>
      </View>
    </View>
  );
}
