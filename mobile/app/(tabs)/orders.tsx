import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { vlClassNames } from "@/lib/design-system";
import { BoxIso, Shop } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gray-50">
      <View 
        className="bg-white px-5 pb-5 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Text className="text-3xl font-black text-gray-950">My Orders</Text>
        <Text className="mt-1 text-sm font-black text-gray-400">
          Track your produce deliveries
        </Text>
      </View>

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
          <BoxIso color="#166534" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No orders yet
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Your produce orders will appear here. Start browsing to place your first
          order.
        </Text>

        <Link href="/(tabs)/marketplace" asChild>
          <Pressable className="mt-7 h-14 w-56 flex-row items-center justify-center gap-2 rounded-2xl bg-green-800 shadow-lg active:bg-green-900">
            <Shop color="#FFFFFF" width={20} height={20} strokeWidth={2} />
            <Text className={vlClassNames.primaryButtonText}>Browse Produce</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
