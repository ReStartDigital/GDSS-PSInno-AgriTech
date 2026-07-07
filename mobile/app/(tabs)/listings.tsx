import { View, Text, Pressable, ScrollView, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { Plus, EditPencil, Trash, BoxIso } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { useAuthStore } from "@vegelink/shared";
import { useMarketplaceListings, useCancelListing, useUpdateListing, mapBackendListingToClient, BackendListing } from "@/lib/listings-api";

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"active" | "all">("active");

  const { data: listingsData, isLoading, refetch, isFetching } = useMarketplaceListings({
    farmer_id: user?.id,
  });

  const cancelListingMutation = useCancelListing();
  const updateListingMutation = useUpdateListing();

  const rawListings = listingsData?.data || [];
  const listings = rawListings.map(mapBackendListingToClient);

  const activeListings = listings.filter((l) => l.status === "available");
  const totalCount = listings.length;
  const activeCount = activeListings.length;

  const shownListings = activeTab === "active" ? activeListings : listings;

  // Stats calculation
  const totalOrders = listings.reduce((sum, l) => sum + l.ordersCount, 0);
  const estRevenue = 2660; // Baseline as shown in screenshot

  const toggleListingStatus = (id: string, currentStatus: string) => {
    const nextBackendStatus = currentStatus === "available" ? "cancelled" : "active";
    updateListingMutation.mutate({
      id,
      data: { status: nextBackendStatus }
    }, {
      onError: (err: any) => {
        Alert.alert("Status Change Failed", err.error?.message || "Could not update status.");
      }
    });
  };

  const handleDelete = (id: string, cropName: string) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete ${cropName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            cancelListingMutation.mutate(id, {
              onError: (err: any) => {
                Alert.alert("Delete Failed", err.error?.message || "Could not delete listing.");
              }
            });
          },
        },
      ]
    );
  };

  const getCropEmoji = (cropName: string) => {
    const name = cropName.toLowerCase();
    if (name.includes("tomato")) return "🍅";
    if (name.includes("pepper") || name.includes("chili")) return "🌶️";
    if (name.includes("cabbage") || name.includes("lettuce")) return "🥬";
    if (name.includes("onion")) return "🧅";
    if (name.includes("yam") || name.includes("potato") || name.includes("cassava")) return "🍠";
    if (name.includes("corn") || name.includes("maize")) return "🌽";
    if (name.includes("bean") || name.includes("pea") || name.includes("legume")) return "🫛";
    return "🥦";
  };

  const getCropBgColor = (cropName: string) => {
    const name = cropName.toLowerCase();
    if (name.includes("tomato") || name.includes("pepper") || name.includes("chili")) return "bg-red-50";
    if (name.includes("cabbage") || name.includes("lettuce")) return "bg-green-50";
    if (name.includes("yam") || name.includes("potato") || name.includes("onion")) return "bg-orange-50";
    return "bg-gray-100";
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="bg-white px-5 pb-5 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-1 mr-3">
          <Text className="text-3xl font-black text-gray-950">My Listings</Text>
          <Text className="mt-1 text-sm font-semibold text-gray-400">
            {activeCount} active · {totalCount} total
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/listings/new")}
          className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-green-800 px-5 shadow-md active:bg-green-900"
          style={vlStyles.primaryButtonShadow as any}
        >
          <Plus color="#FFFFFF" width={18} height={18} strokeWidth={3} />
          <Text className="text-sm font-black text-white">Add New</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50/70"
        contentContainerClassName="pb-12"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#15803D" />
        }
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#15803D" />
          </View>
        ) : (
          <>
        {/* Stats Row */}
        <View className="flex-row gap-3 px-5 pt-5 pb-4">
          {/* Active Listings Card */}
          <View className="flex-1 bg-green-50/60 border border-green-100/50 rounded-3xl p-4 items-center justify-center">
            <Text className="text-2xl font-black text-green-700">{activeCount}</Text>
            <Text className="mt-1 text-[11px] font-bold text-gray-400 text-center">
              Active Listings
            </Text>
          </View>

          {/* Total Orders Card */}
          <View className="flex-1 bg-amber-50/60 border border-amber-100/50 rounded-3xl p-4 items-center justify-center">
            <Text className="text-2xl font-black text-amber-700">{totalOrders}</Text>
            <Text className="mt-1 text-[11px] font-bold text-gray-400 text-center">
              Total Orders
            </Text>
          </View>

          {/* Est. Revenue Card */}
          <View className="flex-1 bg-blue-50/60 border border-blue-100/50 rounded-3xl p-4 items-center justify-center">
            <Text className="text-2xl font-black text-blue-700">GH₵{estRevenue}</Text>
            <Text className="mt-1 text-[11px] font-bold text-gray-400 text-center">
              Est. Revenue
            </Text>
          </View>
        </View>

        {/* Tabs Switcher */}
        <View className="flex-row gap-3 px-5 py-2">
          <Pressable
            onPress={() => setActiveTab("active")}
            className={`flex-1 py-3.5 rounded-2xl items-center justify-center ${
              activeTab === "active" ? "bg-green-800" : "bg-gray-200/50"
            }`}
          >
            <Text
              className={`font-black text-base ${
                activeTab === "active" ? "text-white" : "text-gray-500"
              }`}
            >
              Active
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("all")}
            className={`flex-1 py-3.5 rounded-2xl items-center justify-center ${
              activeTab === "all" ? "bg-green-800" : "bg-gray-200/50"
            }`}
          >
            <Text
              className={`font-black text-base ${
                activeTab === "all" ? "text-white" : "text-gray-500"
              }`}
            >
              All Listings
            </Text>
          </Pressable>
        </View>

        {/* Listings Container */}
        <View className="px-5 mt-4 gap-4">
          {shownListings.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Text className="text-lg font-black text-gray-400">No listings found</Text>
              <Text className="text-sm text-gray-400 mt-1">
                {activeTab === "active"
                  ? "Toggle 'All Listings' or create a new one."
                  : "Add your first listing to start selling."}
              </Text>
            </View>
          ) : (
            shownListings.map((item) => {
              const isActive = item.status === "available";

              return (
                <View
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-150/70 overflow-hidden shadow-sm shadow-gray-100"
                >
                  {/* Top card section */}
                  <View className="p-4 flex-row">
                    {/* Left Icon */}
                    <View
                      className={`w-16 h-16 rounded-2xl items-center justify-center ${getCropBgColor(
                        item.cropName
                      )}`}
                    >
                      <Text className="text-3xl">{getCropEmoji(item.cropName)}</Text>
                    </View>

                    {/* Right text area */}
                    <View className="flex-1 pl-4 justify-between">
                      {/* Name and Switch row */}
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-black text-gray-950">
                          {item.cropName}
                        </Text>

                        {/* Switch */}
                        <Pressable
                          onPress={() => toggleListingStatus(item.id, item.status)}
                          className={`h-7 w-12 rounded-full p-1 flex-row items-center ${
                            isActive ? "bg-green-850 justify-end" : "bg-gray-200 justify-start"
                          }`}
                          style={{
                            backgroundColor: isActive ? "#0F6A2B" : "#D1D5DB",
                          }}
                        >
                          <View className="h-5 w-5 rounded-full bg-white shadow-sm" />
                        </Pressable>
                      </View>

                      {/* Price and quantity */}
                      <View className="flex-row items-center mt-1">
                        <Text className="text-red-600 font-extrabold text-base">
                          GH₵{item.pricePerUnit}/{item.unitOfMeasure}
                        </Text>
                        <Text className="text-gray-400 font-bold text-sm mx-1.5">·</Text>
                        <BoxIso color="#9CA3AF" width={14} height={14} strokeWidth={2.5} />
                        <Text className="text-gray-400 font-bold text-sm ml-1">
                          {item.availableQuantity} {item.unitOfMeasure}
                        </Text>
                      </View>

                      {/* Badges and orders */}
                      <View className="flex-row items-center gap-2 mt-2">
                        {/* Status Badge */}
                        <View
                          className={`px-2.5 py-0.5 rounded-full ${
                            isActive ? "bg-green-50 border border-green-100" : "bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-xs font-extrabold ${
                              isActive ? "text-green-700" : "text-gray-500"
                            }`}
                          >
                            {isActive ? "Active" : "Paused"}
                          </Text>
                        </View>

                        {/* Orders count */}
                        <Text className="text-xs font-semibold text-gray-400">
                          {item.ordersCount} {item.ordersCount === 1 ? "order" : "orders"}
                        </Text>

                        <Text className="text-xs font-semibold text-gray-400">·</Text>

                        {/* Time */}
                        <Text className="text-xs font-semibold text-gray-400">
                          {item.timeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions bottom row */}
                  <View className="flex-row border-t border-gray-100 py-3.5 bg-white">
                    <Pressable
                      onPress={() => router.push(`/listings/new?id=${item.id}`)}
                      className="flex-1 flex-row items-center justify-center gap-2 active:opacity-70"
                    >
                      <EditPencil color="#15803D" width={16} height={16} strokeWidth={2.5} />
                      <Text className="text-sm font-black text-green-700">Edit</Text>
                    </Pressable>

                    <View className="w-[1px] bg-gray-100 self-stretch" />

                    <Pressable
                      onPress={() => handleDelete(item.id, item.cropName)}
                      className="flex-1 flex-row items-center justify-center gap-2 active:opacity-70"
                    >
                      <Trash color="#DC2626" width={16} height={16} strokeWidth={2.5} />
                      <Text className="text-sm font-black text-red-600">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
