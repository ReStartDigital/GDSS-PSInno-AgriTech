import { Link } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@vegelink/shared";
import { useEffect, useMemo } from "react";
import { listingCategories } from "@/lib/marketplace-data";
import { mapBackendListingToClient, useMarketplaceListings } from "@/lib/listings-api";
import { useMyProfile } from "@/lib/user-api";
import { vlColors } from "@/lib/design-system";
import { getGreeting } from "@/lib/utils";
import { composeFullName, getFirstName, mapProfileToAuthUser, roleLabels } from "@/lib/profile-utils";
import {
  ChatBubble,
  Search,
  StatUp,
  Shop,
  BoxIso,
  DeliveryTruck,
  Heart,
} from "iconoir-react-native";

const quickActions = [
  { label: "Browse\nProduce", Icon: Shop, href: "/(tabs)/marketplace" },
  { label: "My Orders", Icon: BoxIso, href: "/(tabs)/orders" },
  { label: "Track\nDelivery", Icon: DeliveryTruck, href: "/(tabs)/orders" },
  { label: "Saved Items", Icon: Heart, href: "/(tabs)/profile" },
] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, accessToken, setAuth } = useAuthStore();
  const { data: profile } = useMyProfile();
  const { data: listingsData, isLoading: isLoadingListings } = useMarketplaceListings();
  const displayUser = profile ? mapProfileToAuthUser(profile, user) : user;
  const firstName = getFirstName(displayUser);
  const fullName = composeFullName(displayUser);
  const role = displayUser?.role ?? "buyer";
  const regionLabel = displayUser?.region ? `${displayUser.region} Region` : "";

  useEffect(() => {
    if (profile && accessToken) {
      const nextUser = mapProfileToAuthUser(profile, user);
      const hasChanged =
        nextUser.firstName !== user?.firstName ||
        nextUser.middleName !== user?.middleName ||
        nextUser.lastName !== user?.lastName ||
        nextUser.fullName !== user?.fullName ||
        nextUser.role !== user?.role ||
        nextUser.region !== user?.region;

      if (hasChanged) {
        setAuth(nextUser, accessToken);
      }
    }
  }, [accessToken, profile, setAuth, user]);

  const marketplaceListings = useMemo(() => {
    return (listingsData?.data || []).map(mapBackendListingToClient);
  }, [listingsData?.data]);

  const pulseItems = marketplaceListings.slice(0, 3).map((listing) => ({
    crop: listing.cropName,
    price: `GHC${listing.pricePerUnit}/${listing.unitOfMeasure}`,
    accent: listing.accentColor,
  }));

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
      >
        <View className="overflow-hidden bg-green-800 px-5 pb-7" style={{ paddingTop: insets.top + 12 }}>
          <View className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-green-600" />
          <View className="absolute right-6 top-7 h-20 w-20 rounded-full bg-lime-900 opacity-40" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={require("@/assets/images/vegelink-Photoroom.png")}
                className="h-7 w-7"
                resizeMode="contain"
              />
              <Text className="text-lg font-black text-white">VegeLink</Text>
            </View>

            <Link href={"/messages" as any} asChild>
              <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
                <ChatBubble color="#FFFFFF" width={22} height={22} strokeWidth={2} />
                <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-yellow-400" />
              </Pressable>
            </Link>
          </View>

          <Text className="mt-9 text-sm font-black text-green-100">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
          </Text>
          <Text className="mt-1 text-2xl font-black text-white">
            {fullName || "Complete your profile"}
          </Text>
          <Text className="mt-2 text-sm font-black capitalize text-yellow-400">
            {[regionLabel, roleLabels[role]].filter(Boolean).join(" - ")}
          </Text>

          <View className="mt-6 min-h-14 flex-row items-center rounded-2xl bg-white px-4">
            <View className="mr-3">
              <Search color="#9CA3AF" width={22} height={22} strokeWidth={2} />
            </View>
            <TextInput
              placeholder="Find fresh produce..."
              placeholderTextColor="#98A1B2"
              className="flex-1 text-base font-black text-gray-950"
            />
          </View>
        </View>

        <View className="-mt-4 px-5">
          <View className="rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
                  <StatUp color="#F97316" width={18} height={18} strokeWidth={2} />
                </View>
                <Text className="text-base font-black text-gray-950">Market Pulse</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-400">Today</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerClassName="gap-3"
            >
              {isLoadingListings ? (
                <ActivityIndicator color="#15803D" size="small" />
              ) : pulseItems.length === 0 ? (
                <Text className="py-3 text-sm font-semibold text-gray-400">
                  No live market data yet.
                </Text>
              ) : pulseItems.map((item) => (
                <View
                  key={item.crop}
                  className="min-w-32 flex-row items-center rounded-2xl bg-gray-50 px-3 py-2"
                >
                  <ProduceMark accent={item.accent} />
                  <View className="ml-3">
                    <Text className="text-xs font-black text-gray-950">
                      {item.crop}
                    </Text>
                    <Text className="text-sm font-black text-gray-950">
                      {item.price}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="text-lg font-black text-gray-950">Quick Actions</Text>
          <View className="mt-5 flex-row justify-between">
            {quickActions.map((action, index) => (
              <Link key={action.label} href={action.href} asChild>
                <Pressable className="w-[22%] items-center active:opacity-75">
                  <View
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor:
                        index === 0
                          ? "#ECFDF3"
                          : index === 1
                            ? "#FFF8E1"
                            : index === 2
                              ? "#EFF6FF"
                              : "#FFF1F2",
                    }}
                  >
                    <action.Icon
                      width={24}
                      height={24}
                      strokeWidth={1.8}
                      color={
                        index === 0
                          ? vlColors.brandGreen
                          : index === 1
                            ? vlColors.warning
                            : index === 2
                              ? vlColors.blue
                              : vlColors.danger
                      }
                    />
                  </View>
                  <Text className="mt-3 text-center text-xs font-black leading-4 text-gray-700">
                    {action.label}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View className="mt-7">
          <Text className="px-5 text-lg font-black text-gray-950">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerClassName="gap-2 px-5"
          >
            {listingCategories.map((category, index) => (
              <Pressable
                key={category}
                className={`rounded-2xl px-5 py-3 ${
                  index === 0 ? "bg-green-800" : "bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-black ${
                    index === 0 ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="mt-7">
          <View className="flex-row items-center justify-between px-5">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-black text-gray-950">Fresh Today</Text>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-red-50">
                <Text className="text-xs font-black text-red-400">!</Text>
              </View>
            </View>
            <Link href="/(tabs)/marketplace" asChild>
              <Pressable>
                <Text className="text-sm font-black text-green-800">See all  ›</Text>
              </Pressable>
            </Link>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerClassName="gap-3 px-5"
          >
            {isLoadingListings ? (
              <View className="w-40 items-center justify-center rounded-2xl bg-white p-8">
                <ActivityIndicator color="#15803D" size="small" />
              </View>
            ) : marketplaceListings.length === 0 ? (
              <View className="rounded-2xl bg-white px-5 py-6">
                <Text className="text-sm font-semibold text-gray-400">
                  No fresh produce is listed yet.
                </Text>
              </View>
            ) : marketplaceListings.slice(0, 4).map((listing) => (
              <Link
                key={listing.id}
                href={{ pathname: "/listings/[id]", params: { id: listing.id } }}
                asChild
              >
                <Pressable className="w-40 overflow-hidden rounded-2xl bg-white active:opacity-80">
                  <View
                    className="h-28 items-center justify-center"
                    style={{ backgroundColor: listing.tintColor }}
                  >
                    <ProduceMark accent={listing.accentColor} large />
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-black text-gray-950" numberOfLines={1}>
                      {listing.cropName}
                    </Text>
                    <Text className="mt-1 text-lg font-black text-green-700">
                      GHC{listing.pricePerUnit}
                      <Text className="text-xs font-semibold text-gray-400">
                        /{listing.unitOfMeasure}
                      </Text>
                    </Text>
                    <Text className="mt-1 text-xs font-semibold text-gray-400">
                      {listing.distanceKm} km away
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function ProduceMark({ accent, large = false }: { accent: string; large?: boolean }) {
  const size = large ? 54 : 28;

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: accent,
        shadowColor: accent,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View
        className="rounded-full bg-white/30"
        style={{ width: size * 0.55, height: size * 0.55 }}
      />
    </View>
  );
}
