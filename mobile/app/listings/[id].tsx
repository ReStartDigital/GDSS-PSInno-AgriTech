import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { findMarketplaceListing, MarketplaceListing } from "@/lib/marketplace-data";
import { useUserSettingsStore } from "@/lib/user-settings-store";
import { vlClassNames } from "@/lib/design-system";
import { initials, getProduceEmoji } from "@/lib/utils";
import {
  NavArrowLeft,
  Heart,
  ShareIos,
  Star,
  MapPin,
  CheckCircle,
  Phone,
  Truck,
  Minus,
  Plus,
} from "iconoir-react-native";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listing = findMarketplaceListing(id);
  const [quantity, setQuantity] = useState(1);

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

  if (!listing) {
    return (
      <View className="flex-1 bg-white px-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-xl font-black text-gray-950">
            Listing not found
          </Text>
          <Text className="mt-2 text-center text-gray-500">
            This produce listing may have been sold or removed.
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

  const subtotal = listing.pricePerUnit * quantity;
  const total = subtotal + transportFee * quantity;

  const { toggleSaveListing, isSaved } = useUserSettingsStore();
  const saved = listing ? isSaved(listing.id) : false;

  const decrement = () => setQuantity((current) => Math.max(1, current - 1));
  const increment = () =>
    setQuantity((current) => Math.max(1, listing ? Math.min(listing.availableQuantity, current + 1) : current + 1));

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-36"
      >
        <View className="relative min-h-72 overflow-hidden bg-green-50 px-5" style={{ paddingTop: insets.top + 8 }}>
          <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-green-200" />
          <View className="absolute -left-9 bottom-0 h-20 w-20 rounded-full bg-green-100" />

          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Go back"
              className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"
              onPress={handleBack}
            >
              <NavArrowLeft color="#111827" width={24} height={24} strokeWidth={2.5} />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm active:bg-gray-50"
                onPress={() => listing && toggleSaveListing(listing.id)}
              >
                <Heart
                  color={saved ? "#EF4444" : "#6B7280"}
                  fill={saved ? "#EF4444" : "none"}
                  width={22}
                  height={22}
                  strokeWidth={2}
                />
              </Pressable>
              <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ShareIos color="#6B7280" width={20} height={20} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          <View className="items-center">
            <ProduceHero listing={listing} />
          </View>

          <View className="mb-5 flex-row items-center justify-between">
            <Pill label={listing.freshnessTag} tone="green" />
            <Pill
              label={`${listing.availableQuantity} ${listing.unitOfMeasure} available`}
              tone="green"
              dot
            />
          </View>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-3xl font-black text-gray-950">
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

          <View className="mt-5 flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <MapPin color="#4B5563" width={16} height={16} strokeWidth={2} />
              <Text className="text-sm font-black text-gray-600">
                {listing.farmer.locationLabel}
              </Text>
            </View>
            <Text className="text-sm font-black text-gray-300">·</Text>
            <Text className="text-sm font-black text-gray-500">
              {listing.distanceKm} km away
            </Text>
          </View>

          <View className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
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
              {transportFee} transport
            </Text>
            <Text className="text-lg font-black text-gray-950">GHC{total}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 shadow-2xl" style={{ paddingBottom: Math.max(insets.bottom, 28) }}>
        <Link href={`/listings/${listing.id}/order`} asChild>
          <Pressable className={vlClassNames.primaryButton}>
            <Text className={vlClassNames.primaryButtonText}>
              Order · GHC{total}
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function ProduceHero({ listing }: { listing: MarketplaceListing }) {
  const emoji = getProduceEmoji(listing.cropName);
  return (
    <View className="h-40 w-40 items-center justify-center">
      <View
        className="h-28 w-28 items-center justify-center rounded-full"
        style={{
          backgroundColor: listing.accentColor,
          shadowColor: listing.accentColor,
          shadowOpacity: 0.24,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
        }}
      >
        <View className="absolute -right-2 top-2 h-10 w-14 rotate-45 rounded-full bg-white/35" />
        <Text className="text-5xl">
          {emoji}
        </Text>
      </View>
    </View>
  );
}

function Pill({
  label,
  tone,
  dot = false,
}: {
  label: string;
  tone: "green";
  dot?: boolean;
}) {
  return (
    <View className="flex-row items-center rounded-full bg-green-50 px-3 py-1.5">
      {dot ? <View className="mr-2 h-2 w-2 rounded-full bg-green-700" /> : null}
      <Text className="text-[11px] font-black text-green-800">{label}</Text>
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


