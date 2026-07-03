import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function JobsScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Transport Jobs" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-600">Available transport jobs will appear here.</Text>
      </View>
    </View>
  );
}
