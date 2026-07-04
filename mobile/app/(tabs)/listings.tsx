import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { List, Plus } from "iconoir-react-native";
import { vlClassNames } from "@/lib/design-system";

export default function ListingsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="My Listings" subtitle="Manage your produce" />

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
          <List color="#166534" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No listings yet
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Your produce listings will appear here. Add your first listing to
          start selling.
        </Text>

        <Link href="/listings/new" asChild>
          <Pressable className="mt-7 h-14 w-56 flex-row items-center justify-center gap-2 rounded-2xl bg-green-800 shadow-lg active:bg-green-900">
            <Plus color="#FFFFFF" width={20} height={20} strokeWidth={2} />
            <Text className={vlClassNames.primaryButtonText}>Add Listing</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
