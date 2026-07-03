import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  listingCategories,
  ListingCategoryFilter,
  MarketplaceListing,
  marketplaceListings,
} from "@/lib/marketplace-data";

type SortMode = "nearest" | "price_low" | "price_high" | "stock";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Nearest", value: "nearest" },
  { label: "Low price", value: "price_low" },
  { label: "High price", value: "price_high" },
  { label: "Most stock", value: "stock" },
];

export function ListingFlatList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ListingCategoryFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("nearest");

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return marketplaceListings
      .filter((listing) => {
        const matchesCategory =
          selectedCategory === "All" || listing.category === selectedCategory;
        const matchesSearch =
          normalizedQuery.length === 0 ||
          listing.cropName.toLowerCase().includes(normalizedQuery) ||
          listing.farmer.fullName.toLowerCase().includes(normalizedQuery) ||
          listing.farmer.locationLabel.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesSearch && listing.status === "available";
      })
      .sort((left, right) => {
        if (sortMode === "price_low") {
          return left.pricePerUnit - right.pricePerUnit;
        }

        if (sortMode === "price_high") {
          return right.pricePerUnit - left.pricePerUnit;
        }

        if (sortMode === "stock") {
          return right.availableQuantity - left.availableQuantity;
        }

        return left.distanceKm - right.distanceKm;
      });
  }, [searchQuery, selectedCategory, sortMode]);

  return (
    <FlatList
      data={filteredListings}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 px-4 pb-8"
      ListHeaderComponent={
        <View className="gap-4 pb-2 pt-4">
          <View className="rounded-lg border border-green-100 bg-green-50 px-4 py-4">
            <Text className="text-xs font-semibold uppercase text-green-700">
              Greater Accra vegetable belt
            </Text>
            <Text className="mt-1 text-2xl font-bold text-green-950">
              Fresh produce near you
            </Text>
            <Text className="mt-2 text-sm leading-5 text-green-900">
              Compare price, stock, farmer location, packaging, and delivery
              timing before you place an order.
            </Text>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search crop, farmer, or town"
            placeholderTextColor="#6B7280"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-950"
            returnKeyType="search"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {listingCategories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  className={`rounded-full border px-4 py-2 ${
                    isActive
                      ? "border-green-800 bg-green-800"
                      : "border-gray-200 bg-white"
                  }`}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {sortOptions.map((option) => {
              const isActive = sortMode === option.value;

              return (
                <Pressable
                  key={option.value}
                  className={`rounded-lg border px-3 py-2 ${
                    isActive
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 bg-white"
                  }`}
                  onPress={() => setSortMode(option.value)}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? "text-amber-800" : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text className="text-sm text-gray-500">
            {filteredListings.length} active listing
            {filteredListings.length === 1 ? "" : "s"} available
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View className="rounded-lg border border-dashed border-gray-300 px-5 py-8">
          <Text className="text-center text-lg font-semibold text-gray-900">
            No listings found
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Try another crop, farmer, location, or category.
          </Text>
        </View>
      }
      renderItem={({ item }) => <ListingCard listing={item} />}
    />
  );
}

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link href={`/listings/${listing.id}`} asChild>
      <Pressable className="rounded-lg border border-gray-200 bg-white p-4 active:bg-green-50">
        <View className="flex-row gap-3">
          <View
            className="h-16 w-16 items-center justify-center rounded-lg"
            style={{ backgroundColor: listing.tintColor }}
          >
            <Text
              className="text-xl font-black"
              style={{ color: listing.accentColor }}
            >
              {listing.cropName
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-green-950">
                  {listing.cropName}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  {listing.farmer.locationLabel}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-green-900">
                  GHS {listing.pricePerUnit}
                </Text>
                <Text className="text-xs text-gray-500">
                  per {listing.unitOfMeasure}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              <Badge label={listing.freshnessTag} tone="green" />
              <Badge label={`${listing.distanceKm} km`} tone="gray" />
              <Badge label={listing.deliveryEstimate} tone="amber" />
            </View>

            <View className="mt-4 border-t border-gray-100 pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-800">
                  {listing.availableQuantity} {listing.unitOfMeasure} available
                </Text>
                <Text className="text-sm font-semibold text-green-800">
                  View details
                </Text>
              </View>
              <Text className="mt-1 text-xs text-gray-500">
                Recommended: {listing.packagingRecommendation}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "gray" }) {
  const toneClassName = {
    green: { container: "bg-green-50", text: "text-green-800" },
    amber: { container: "bg-amber-50", text: "text-amber-800" },
    gray: { container: "bg-gray-100", text: "text-gray-700" },
  }[tone];

  return (
    <View className={`rounded-full px-2.5 py-1 ${toneClassName.container}`}>
      <Text className={`text-xs font-semibold ${toneClassName.text}`}>{label}</Text>
    </View>
  );
}
