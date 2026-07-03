import { FlatList, Text, View } from "react-native";

const PLACEHOLDER_LISTINGS = [
  { id: "1", name: "Fresh Tomatoes", price: "GHS 15/kg" },
  { id: "2", name: "Garden Eggs", price: "GHS 8/kg" },
  { id: "3", name: "Okra", price: "GHS 12/kg" },
];

export function ListingFlatList() {
  return (
    <FlatList
      data={PLACEHOLDER_LISTINGS}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4 gap-3"
      renderItem={({ item }) => (
        <View className="rounded-lg border border-gray-200 p-4">
          <Text className="text-lg font-semibold text-green-900">{item.name}</Text>
          <Text className="mt-1 text-gray-600">{item.price}</Text>
        </View>
      )}
    />
  );
}
