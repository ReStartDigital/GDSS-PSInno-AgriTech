import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { findMarketplaceListing } from "@/lib/marketplace-data";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = findMarketplaceListing(id);

  if (!listing) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Listing Details" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-semibold text-gray-900">
            Listing not found
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            This produce listing may have been sold or removed.
          </Text>
          <Pressable
            className="mt-6 rounded-lg bg-green-800 px-5 py-3"
            onPress={() => router.back()}
          >
            <Text className="font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const estimatedTotal = listing.pricePerUnit * 10;
  const pickupCoordinates = listing.pickupLocation.coordinates;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Listing Details" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="rounded-lg border border-gray-200 bg-white p-4">
          <View
            className="h-44 items-center justify-center rounded-lg"
            style={{ backgroundColor: listing.tintColor }}
          >
            <Text
              className="text-5xl font-black"
              style={{ color: listing.accentColor }}
            >
              {listing.cropName
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </Text>
          </View>

          <View className="mt-5 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-3xl font-black text-green-950">
                {listing.cropName}
              </Text>
              <Text className="mt-2 text-gray-600">{listing.description}</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-black text-green-900">
                GHS {listing.pricePerUnit}
              </Text>
              <Text className="text-sm text-gray-500">
                per {listing.unitOfMeasure}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row flex-wrap gap-2">
            <DetailPill label={listing.freshnessTag} />
            <DetailPill label={listing.harvestLabel} />
            <DetailPill label={`${listing.distanceKm} km away`} />
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Farmer</Text>
          <View className="mt-3 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-green-900">
              <Text className="font-black text-white">
                {listing.farmer.fullName
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-950">
                {listing.farmer.fullName}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                {listing.farmer.locationLabel}
              </Text>
            </View>
            <Text className="font-semibold text-amber-700">
              {listing.farmer.rating.toFixed(1)}/5
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">
            Order readiness
          </Text>
          <MetricRow
            label="Available quantity"
            value={`${listing.availableQuantity} ${listing.unitOfMeasure}`}
          />
          <MetricRow label="Packaging" value={listing.packagingRecommendation} />
          <MetricRow label="Delivery estimate" value={listing.deliveryEstimate} />
          <MetricRow
            label="Pickup coordinates"
            value={`${pickupCoordinates[1].toFixed(4)}, ${pickupCoordinates[0].toFixed(4)}`}
          />
          <View className="mt-4 rounded-lg bg-amber-50 p-3">
            <Text className="font-semibold text-amber-900">Sample order</Text>
            <Text className="mt-1 text-sm text-amber-900">
              10 {listing.unitOfMeasure} would cost about GHS {estimatedTotal}
              before packaging, transport, and Paystack checkout.
            </Text>
          </View>
        </View>

        <Pressable
          className="mt-5 rounded-lg bg-green-800 py-4"
          onPress={() =>
            Alert.alert(
              "Start order",
              "Next you will choose quantity, packaging, transport, and payment.",
            )
          }
        >
          <Text className="text-center text-base font-bold text-white">
            Start Order
          </Text>
        </Pressable>

        <Pressable
          className="mt-3 rounded-lg border border-gray-300 py-4"
          onPress={() => router.back()}
        >
          <Text className="text-center font-semibold text-gray-800">
            Back to Marketplace
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DetailPill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-green-50 px-3 py-1.5">
      <Text className="text-xs font-semibold text-green-800">{label}</Text>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-4 flex-row items-start justify-between gap-4 border-t border-gray-100 pt-4">
      <Text className="flex-1 text-sm text-gray-600">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-gray-950">
        {value}
      </Text>
    </View>
  );
}
