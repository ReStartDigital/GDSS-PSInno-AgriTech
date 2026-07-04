import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Truck } from "iconoir-react-native";

export default function JobsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Transport Jobs" subtitle="Find deliveries near you" />

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">
          <Truck color="#2563EB" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No jobs available
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Available transport jobs will appear here when farmers and buyers need
          deliveries in your area.
        </Text>
      </View>
    </View>
  );
}
