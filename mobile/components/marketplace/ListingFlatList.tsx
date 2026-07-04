import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  listingCategories,
  ListingCategoryFilter,
  MarketplaceListing,
  marketplaceListings,
} from "@/lib/marketplace-data";
import { vlClassNames, vlColors } from "@/lib/design-system";
import {
  ViewGrid,
  List as ListIcon,
  Search,
  FilterList,
  NavArrowDown,
  Filter,
  Star,
  MapPin,
  Heart,
  Xmark,
  Check,
} from "iconoir-react-native";

type SortMode = "nearest" | "price_low" | "price_high" | "stock";
type ViewMode = "grid" | "list";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Nearest First", value: "nearest" },
  { label: "Lowest Price", value: "price_low" },
  { label: "Highest Price", value: "price_high" },
  { label: "Most Stock", value: "stock" },
];

const regions = [
  "All Regions",
  "Greater Accra",
  "Ashanti",
  "Eastern",
  "Northern",
  "Western",
  "Volta",
  "Brong-Ahafo",
] as const;

export function ListingFlatList() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ListingCategoryFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("nearest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRegion, setSelectedRegion] = useState<(typeof regions)[number]>(
    "All Regions",
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeSortLabel =
    sortOptions.find((option) => option.value === sortMode)?.label ?? "Nearest First";

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return marketplaceListings
      .filter((listing) => {
        const matchesCategory =
          selectedCategory === "All" || listing.category === selectedCategory;
        const matchesRegion =
          selectedRegion === "All Regions" ||
          listing.farmer.locationLabel.includes(selectedRegion);
        const matchesSearch =
          normalizedQuery.length === 0 ||
          listing.cropName.toLowerCase().includes(normalizedQuery) ||
          listing.farmer.fullName.toLowerCase().includes(normalizedQuery) ||
          listing.farmer.locationLabel.toLowerCase().includes(normalizedQuery);

        return (
          matchesCategory &&
          matchesRegion &&
          matchesSearch &&
          listing.status === "available"
        );
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
  }, [searchQuery, selectedCategory, selectedRegion, sortMode]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedRegion("All Regions");
    setSortMode("nearest");
    setSearchQuery("");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 112,
          paddingTop: Math.max(insets.top, 16),
        }}
      >
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-black text-gray-950">Browse Produce</Text>
            <Text className="mt-1 text-sm font-black text-gray-400">
              {marketplaceListings.length} products available
            </Text>
          </View>

          <Pressable
            accessibilityLabel={viewMode === "grid" ? "Show list view" : "Show grid view"}
            className="h-12 w-12 items-center justify-center rounded-2xl border-2 bg-gray-100 active:bg-gray-200"
            style={{ borderColor: viewMode === "grid" ? vlColors.brandGreen : "transparent" }}
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <ListIcon color="#374151" width={22} height={22} strokeWidth={2} />
            ) : (
              <ViewGrid color="#374151" width={22} height={22} strokeWidth={2} />
            )}
          </Pressable>
        </View>

        <View className="mt-5 min-h-12 flex-row items-center rounded-2xl bg-gray-100 px-4">
          <Search color="#9CA3AF" width={20} height={20} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search vegetables, regions..."
            placeholderTextColor="#98A1B2"
            returnKeyType="search"
            className="ml-2 flex-1 text-sm font-black text-gray-950"
          />
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            className="h-11 flex-1 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 active:bg-gray-50"
            onPress={() =>
              setSortMode((current) =>
                current === "nearest"
                  ? "price_low"
                  : current === "price_low"
                    ? "price_high"
                    : current === "price_high"
                      ? "stock"
                      : "nearest",
              )
            }
          >
            <View className="flex-row items-center gap-2">
              <FilterList color="#166534" width={18} height={18} strokeWidth={2} />
              <Text className="text-sm font-black text-gray-700">{activeSortLabel}</Text>
            </View>
            <NavArrowDown color="#9CA3AF" width={18} height={18} strokeWidth={2} />
          </Pressable>

          <Pressable
            className="h-11 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 active:bg-gray-50"
            onPress={() => setIsFilterOpen(true)}
          >
            <Filter color="#6B7280" width={18} height={18} strokeWidth={2} />
            <Text className="ml-2 text-sm font-black text-gray-700">Filter</Text>
          </Pressable>
        </View>

        {filteredListings.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : viewMode === "grid" ? (
          <View className="mt-5 flex-row flex-wrap justify-between">
            {filteredListings.map((listing) => (
              <GridCard key={listing.id} listing={listing} />
            ))}
          </View>
        ) : (
          <View className="mt-5 gap-3">
            {filteredListings.map((listing) => (
              <ListCard key={listing.id} listing={listing} />
            ))}
          </View>
        )}
      </ScrollView>

      <FilterSheet
        visible={isFilterOpen}
        selectedCategory={selectedCategory}
        selectedRegion={selectedRegion}
        onClose={() => setIsFilterOpen(false)}
        onReset={resetFilters}
        onSelectCategory={setSelectedCategory}
        onSelectRegion={setSelectedRegion}
      />
    </View>
  );
}

function ListCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link href={{ pathname: "/listings/[id]", params: { id: listing.id } }} asChild>
      <Pressable className="rounded-2xl bg-white p-3 shadow-sm active:opacity-80">
        <View className="flex-row items-center">
          <ProduceThumb listing={listing} size="sm" />

          <View className="ml-4 flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="text-base font-black text-gray-950" numberOfLines={2}>
                  {listing.cropName}
                </Text>
                <Price listing={listing} />
              </View>
              <FreshnessPill listing={listing} compact />
            </View>

            <View className="mt-2 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Star color="#F59E0B" fill="#F59E0B" width={14} height={14} strokeWidth={2} />
                <Text className="text-xs font-black text-amber-500">
                  {listing.farmer.rating.toFixed(1)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MapPin color="#9CA3AF" width={14} height={14} strokeWidth={2} />
                <Text className="text-xs font-semibold text-gray-400">
                  {listing.distanceKm} km
                </Text>
              </View>
            </View>
          </View>

          <Pressable className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-gray-50">
            <Heart color="#D1D5DB" width={20} height={20} strokeWidth={2} />
          </Pressable>
        </View>
      </Pressable>
    </Link>
  );
}

function GridCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link href={{ pathname: "/listings/[id]", params: { id: listing.id } }} asChild>
      <Pressable className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white active:opacity-80">
        <View
          className="h-32 items-center justify-center"
          style={{ backgroundColor: listing.tintColor }}
        >
          <View className="absolute left-3 top-3">
            <FreshnessPill listing={listing} compact />
          </View>
          <Pressable className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white">
            <Heart color="#D1D5DB" width={18} height={18} strokeWidth={2} />
          </Pressable>
          <ProduceThumb listing={listing} size="lg" />
        </View>

        <View className="p-3">
          <Text className="text-base font-black text-gray-950" numberOfLines={2}>
            {listing.cropName}
          </Text>
          <Price listing={listing} />
          <View className="mt-2 flex-row items-center gap-1">
            <Star color="#F59E0B" fill="#F59E0B" width={14} height={14} strokeWidth={2} />
            <Text className="text-xs font-black text-amber-500">
              {listing.farmer.rating.toFixed(1)}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center gap-1">
            <MapPin color="#9CA3AF" width={14} height={14} strokeWidth={2} />
            <Text className="text-xs font-semibold text-gray-400" numberOfLines={1}>
              {listing.farmer.locationLabel} · {listing.distanceKm} km
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function Price({ listing }: { listing: MarketplaceListing }) {
  return (
    <Text className="mt-1 text-lg font-black text-green-700">
      GHC{listing.pricePerUnit}
      <Text className="text-xs font-semibold text-gray-400">
        /{listing.unitOfMeasure}
      </Text>
    </Text>
  );
}

function FreshnessPill({
  listing,
  compact = false,
}: {
  listing: MarketplaceListing;
  compact?: boolean;
}) {
  const isBlue = listing.freshnessTag === "Top rated";
  const isYellow = listing.freshnessTag === "Best value" || listing.freshnessTag === "In season";

  return (
    <View
      className={`rounded-full ${compact ? "px-2 py-1" : "px-3 py-1.5"}`}
      style={{
        backgroundColor: isBlue ? "#DBEAFE" : isYellow ? "#FEF3C7" : "#DCFCE7",
      }}
    >
      <Text
        className="text-[10px] font-black"
        style={{
          color: isBlue ? vlColors.blue : isYellow ? "#92400E" : vlColors.brandGreen,
        }}
      >
        {listing.freshnessTag}
      </Text>
    </View>
  );
}

function ProduceThumb({
  listing,
  size,
}: {
  listing: MarketplaceListing;
  size: "sm" | "lg";
}) {
  const dimensions = size === "sm" ? "h-20 w-20" : "h-24 w-24";
  const cropInitials = listing.cropName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <View
      className={`${dimensions} items-center justify-center rounded-2xl`}
      style={{ backgroundColor: listing.tintColor }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: listing.accentColor,
          shadowColor: listing.accentColor,
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 7 },
        }}
      >
        <View className="absolute -right-1 -top-1 h-5 w-7 rotate-45 rounded-full bg-white/40" />
        <Text className="text-base font-black text-white">{cropInitials}</Text>
      </View>
    </View>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <View className="mt-8 items-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10">
      <Text className="text-xl font-black text-gray-950">No produce found</Text>
      <Text className="mt-2 text-center text-sm leading-6 text-gray-500">
        Try another crop, category, region, or sort option.
      </Text>
      <Pressable className="mt-5 rounded-2xl bg-green-800 px-6 py-3" onPress={onReset}>
        <Text className="font-black text-white">Reset Filters</Text>
      </Pressable>
    </View>
  );
}

function FilterSheet({
  visible,
  selectedCategory,
  selectedRegion,
  onClose,
  onReset,
  onSelectCategory,
  onSelectRegion,
}: {
  visible: boolean;
  selectedCategory: ListingCategoryFilter;
  selectedRegion: (typeof regions)[number];
  onClose: () => void;
  onReset: () => void;
  onSelectCategory: (category: ListingCategoryFilter) => void;
  onSelectRegion: (region: (typeof regions)[number]) => void;
}) {
  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: Math.max(28, 28) }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-black text-gray-950">Filter Produce</Text>
            <Pressable
              accessibilityLabel="Close filter"
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              onPress={onClose}
            >
              <Xmark color="#9CA3AF" width={20} height={20} strokeWidth={2.5} />
            </Pressable>
          </View>

          <Text className="mt-5 text-sm font-black uppercase text-gray-500">
            Category
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {listingCategories.map((category) => {
              const active = selectedCategory === category;

              return (
                <Pressable
                  key={category}
                  className={`rounded-2xl px-5 py-3 ${
                    active ? "bg-green-800" : "bg-gray-100"
                  }`}
                  onPress={() => onSelectCategory(category)}
                >
                  <Text
                    className={`text-sm font-black ${
                      active ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-7 text-sm font-black uppercase text-gray-500">
            Region
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-between gap-y-2">
            {regions.map((region) => {
              const active = selectedRegion === region;

              return (
                <Pressable
                  key={region}
                  className={`h-11 w-[48%] flex-row items-center justify-between rounded-2xl border px-4 ${
                    active ? "bg-green-50" : "bg-gray-100"
                  }`}
                  style={{
                    borderColor: active ? vlColors.brandGreen : "transparent",
                  }}
                  onPress={() => onSelectRegion(region)}
                >
                  <Text
                    className={`text-sm font-black ${
                      active ? "text-green-800" : "text-gray-700"
                    }`}
                  >
                    {region}
                  </Text>
                  {active ? (
                    <Check color="#166534" width={18} height={18} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View className="mt-8 flex-row gap-3">
            <Pressable
              className="h-14 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white"
              onPress={handleReset}
            >
              <Text className="font-black text-gray-600">Reset</Text>
            </Pressable>
            <Pressable
              className={`h-14 flex-[2] items-center justify-center ${vlClassNames.primaryButton}`}
              onPress={onClose}
            >
              <Text className={vlClassNames.primaryButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
