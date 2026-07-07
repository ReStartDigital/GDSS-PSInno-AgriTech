import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vlClassNames } from "@/lib/design-system";
import { initials } from "@/lib/utils";
import {
  NavArrowLeft,
  Star,
  CheckCircle,
  Phone,
  Truck,
  Minus,
  Plus,
} from "iconoir-react-native";
import { useListingDetails, mapBackendListingToClient } from "@/lib/listings-api";
import { useCreateOrder } from "@/lib/orders-api";
import { MarketplaceListing } from "@/lib/marketplace-data";

export default function ListingOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(1);

  const { data: rawListing, isLoading } = useListingDetails(id || "");
  const createOrderMutation = useCreateOrder();

  const listing = useMemo(() => {
    return rawListing ? mapBackendListingToClient(rawListing) : null;
  }, [rawListing]);

  const transportFee = useMemo(() => {
    if (!listing) {
      return 0;
    }

    return Math.max(1, Math.round(listing.distanceKm / 12));
  }, [listing]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/marketplace");
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

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
            onPress={handleBack}
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
    setQuantity((current) => Math.min(listing ? listing.availableQuantity : 9999, current + 1));

  const handleOrder = () => {
    if (!listing || !rawListing) return;

    createOrderMutation.mutate({
      listing_id: rawListing.id,
      quantity_kg: quantity,
      mode: rawListing.supportsDelivery ? "delivery" : "pickup",
      delivery_address: "Deliver to customer location",
      packaging_type_id: rawListing.recommendedPackagingId || null,
    }, {
      onSuccess: (createdOrder) => {
        Alert.alert(
          "Order Placed",
          `${quantity} kg of ${listing.cropName} has been successfully ordered.`,
          [
            {
              text: "View Order",
              onPress: () => router.replace(`/orders/${createdOrder.id}`),
            }
          ]
        );
      },
      onError: (err: any) => {
        Alert.alert("Checkout Failed", err.error?.message || "Could not place order.");
      }
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 144, paddingHorizontal: 20 }}
      >
        <View className="mb-6">
          <Pressable
            accessibilityLabel="Go back"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200"
            onPress={handleBack}
          >
            <NavArrowLeft color="#111827" width={24} height={24} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-black leading-tight text-gray-950">
              {listing.cropName}
            </Text>
            <View className="mt-2 flex-row items-center gap-2">
              <Text className="text-3xl font-black text-green-700">
                GHC{listing.pricePerUnit}
              </Text>
              <Text className="text-base font-black text-gray-400">
                /{listing.unitOfMeasure}
              </Text>
              <View className="ml-2 flex-row items-center gap-1">
                <Star color="#F59E0B" fill="#F59E0B" width={16} height={16} strokeWidth={2} />
                <Text className="text-base font-black text-amber-500">
                  {listing.farmer.rating.toFixed(1)}
                </Text>
              </View>
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
            <Truck color="#2563EB" width={18} height={18} strokeWidth={2} />
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
            <Minus color="#6B7280" width={18} height={18} strokeWidth={2.5} />
          </Pressable>
          <View className="h-12 flex-1 items-center justify-center rounded-2xl border border-green-200 bg-green-50">
            <Text className="text-xl font-black text-green-800">{quantity}</Text>
          </View>
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-2xl bg-green-800 shadow-sm"
            onPress={increment}
          >
            <Plus color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
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

      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom, 28) }}>
        <Pressable
          className={vlClassNames.primaryButton}
          onPress={handleOrder}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className={vlClassNames.primaryButtonText}>Order - GHC{total}</Text>
          )}
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
            <CheckCircle color="#166534" fill="#DCFCE7" width={16} height={16} strokeWidth={2} />
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            <Star color="#F59E0B" fill="#F59E0B" width={12} height={12} strokeWidth={2} />
            <Text className="text-xs font-black text-amber-500">
              {listing.farmer.rating.toFixed(1)}
              <Text className="text-gray-400">  Verified Seller</Text>
            </Text>
          </View>
        </View>
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
          <Phone color="#166534" width={20} height={20} strokeWidth={2} />
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


