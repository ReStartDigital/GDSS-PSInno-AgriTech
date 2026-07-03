import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { findMarketplaceListing, MarketplaceListing } from "@/lib/marketplace-data";
import { vlClassNames } from "@/lib/design-system";

export default function ListingOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = findMarketplaceListing(id);
  const [quantity, setQuantity] = useState(1);

  const transportFee = useMemo(() => {
    if (!listing) {
      return 0;
    }

    return Math.max(1, Math.round(listing.distanceKm / 12));
  }, [listing]);

  if (!listing) {
    return (
      <View className="flex-1 bg-white px-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-xl font-black text-gray-950">
            Listing not found
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            Return to Browse and choose an available listing.
          </Text>
          <Pressable
            className="mt-6 rounded-2xl bg-green-800 px-6 py-4"
            onPress={() => router.back()}
          >
            <Text className="font-black text-white">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const produceSubtotal = listing.pricePerUnit * quantity;
  const transportTotal = transportFee * quantity;
  const total = produceSubtotal + transportTotal;

  const decrement = () => setQuantity((current) => Math.max(1, current - 1));
  const increment = () =>
    setQuantity((current) => Math.min(listing.availableQuantity, current + 1));

  const handleOrder = () => {
    Alert.alert(
      "Order prepared",
      `${quantity} ${listing.unitOfMeasure} of ${listing.cropName} is ready for farmer confirmation.`,
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-36 pt-10"
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-black leading-tight text-gray-950">
              {listing.cropName}
            </Text>
            <View className="mt-2 flex-row items-baseline gap-2">
              <Text className="text-3xl font-black text-green-700">
                GHC{listing.pricePerUnit}
              </Text>
              <Text className="text-base font-black text-gray-400">
                /{listing.unitOfMeasure}
              </Text>
              <Text className="text-base font-black text-amber-500">
                * {listing.farmer.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl bg-gray-100 px-4 py-3">
            <Text className="text-sm font-black text-gray-600">
              {listing.category}
            </Text>
          </View>
        </View>

        <View className="mt-6 flex-row items-center gap-4">
          <Text className="text-sm font-black text-gray-600">
            {listing.farmer.locationLabel}
          </Text>
          <Text className="text-sm font-black text-gray-300">.</Text>
          <Text className="text-sm font-black text-gray-500">
            {listing.distanceKm} km away
          </Text>
        </View>

        <SellerCard listing={listing} />

        <Text className="mt-6 text-sm font-black uppercase text-gray-500">
          About this produce
        </Text>
        <Text className="mt-3 text-base leading-7 text-gray-700">
          {listing.description}
        </Text>

        <View className="mt-6 rounded-3xl border border-dashed border-gray-300 p-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-blue-600">[]</Text>
            <Text className="text-sm font-black text-gray-700">
              Transport Estimate
            </Text>
          </View>
          <View className="mt-4 flex-row gap-3">
            <EstimateTile value={listing.deliveryEstimate} label="Delivery" />
            <EstimateTile value={`${listing.distanceKm} km`} label="Distance" />
            <EstimateTile
              value={`GHC${transportFee}/${listing.unitOfMeasure}`}
              label="Transport fee"
            />
          </View>
        </View>

        <Text className="mt-6 text-sm font-black uppercase text-gray-500">
          Quantity ({listing.unitOfMeasure}s)
        </Text>
        <View className="mt-4 flex-row items-center gap-4">
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100"
            onPress={decrement}
          >
            <Text className="text-2xl font-black text-gray-500">-</Text>
          </Pressable>
          <View className="h-12 flex-1 items-center justify-center rounded-2xl border border-green-200 bg-green-50">
            <Text className="text-xl font-black text-green-800">{quantity}</Text>
          </View>
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-2xl bg-green-800 shadow-sm"
            onPress={increment}
          >
            <Text className="text-2xl font-black text-white">+</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <Text className="text-xs font-black text-gray-500">
            GHC{listing.pricePerUnit} x {quantity} {listing.unitOfMeasure} + GHC
            {transportTotal} transport
          </Text>
          <Text className="text-lg font-black text-gray-950">GHC{total}</Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-7 pt-4 shadow-2xl">
        <Pressable className={vlClassNames.primaryButton} onPress={handleOrder}>
          <Text className={vlClassNames.primaryButtonText}>Order - GHC{total}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SellerCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <View className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-600">
          <Text className="text-lg font-black text-white">
            {initials(listing.farmer.fullName)}
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-gray-950">
              {listing.farmer.fullName}
            </Text>
            <Text className="text-base font-black text-green-700">OK</Text>
          </View>
          <Text className="mt-1 text-xs font-black text-amber-500">
            * {listing.farmer.rating.toFixed(1)}
            <Text className="text-gray-400">  Verified Seller</Text>
          </Text>
        </View>
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
          <Text className="text-xs font-black text-green-800">Call</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EstimateTile({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-h-20 flex-1 items-center justify-center rounded-2xl bg-blue-50 px-2">
      <Text className="text-xs font-black text-blue-700" numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-1 text-[10px] font-semibold text-gray-500">{label}</Text>
    </View>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}
