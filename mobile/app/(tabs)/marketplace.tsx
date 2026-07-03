import { View } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ListingFlatList } from "@/components/marketplace/ListingFlatList";

export default function MarketplaceScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Marketplace" />
      <ListingFlatList />
    </View>
  );
}
