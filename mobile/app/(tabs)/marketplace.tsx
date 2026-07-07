import { View } from "react-native";
import { ListingFlatList } from "@/components/marketplace/ListingFlatList";

export default function MarketplaceScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ListingFlatList />
    </View>
  );
}
