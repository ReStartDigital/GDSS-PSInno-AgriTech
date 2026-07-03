import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { vlClassNames } from "@/lib/design-system";

export default function OrdersScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pb-5 pt-12 shadow-sm">
        <Text className="text-3xl font-black text-gray-950">My Orders</Text>
        <Text className="mt-1 text-sm font-black text-gray-400">
          Track your produce deliveries
        </Text>
      </View>

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
          <View className="h-12 w-12 items-center justify-center rounded-xl border-2 border-green-800">
            <View className="h-5 w-8 border-b-2 border-green-800" />
            <Text className="absolute text-base font-black text-green-800">[]</Text>
          </View>
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No orders yet
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Your produce orders will appear here. Start browsing to place your first
          order.
        </Text>

        <Link href="/(tabs)/marketplace" asChild>
          <Pressable className="mt-7 h-14 w-56 items-center justify-center rounded-2xl bg-green-800 shadow-lg active:bg-green-900">
            <Text className={vlClassNames.primaryButtonText}>[] Browse Produce</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
