import { useMemo, useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { Alert } from "@/lib/alert-service";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavArrowLeft, NavArrowDown, Pin, Check, PlusCircle, Camera, Xmark, MediaImage } from "iconoir-react-native";
import { useCreateListing, useUpdateListing, useListingDetails, useRecommendPackaging, useUploadListingImage } from "@/lib/listings-api";
import { useAgentClients } from "@/lib/user-api";
import { useAuthStore } from "@vegelink/shared";
import * as ImagePicker from "expo-image-picker";

const unitOptions = ["kg", "crate", "basket", "head", "bunch", "sack"] as const;

const categories = ["Vegetables", "Roots", "Leafy", "Legumes", "Fruits"] as const;
const MAX_LISTING_IMAGES = 8;

const colorMap: Record<string, { tintColor: string; accentColor: string }> = {
  Vegetables: { tintColor: "#FEF2F2", accentColor: "#DC2626" },
  Roots:      { tintColor: "#FFF8F0", accentColor: "#92400E" },
  Leafy:      { tintColor: "#F0FDF4", accentColor: "#15803D" },
  Legumes:    { tintColor: "#F0FDF4", accentColor: "#166534" },
  Fruits:     { tintColor: "#FFFBEB", accentColor: "#B45309" },
};

export default function NewListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = !!id;

  const { data: existingListing } = useListingDetails(id || "");
  const createListingMutation = useCreateListing();
  const updateListingMutation = useUpdateListing();

  const [cropName, setCropName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Vegetables");
  const [unitOfMeasure, setUnitOfMeasure] = useState<(typeof unitOptions)[number]>("kg");

  const [images, setImages] = useState<string[]>([]);
  const uploadImageMutation = useUploadListingImage();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Success state
  const [listingPosted, setListingPosted] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Agent farmer client selection state
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.role === "agent";
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);

  const { data: clientsData } = useAgentClients();
  const farmersList = useMemo(() => {
    return clientsData?.data || [];
  }, [clientsData]);

  // Load existing listing data in edit mode
  useEffect(() => {
    if (existingListing) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCropName(existingListing.vegetableType);
      setDescription(existingListing.harvestDate ? `Harvest date: ${existingListing.harvestDate}` : "");
      setPriceText(existingListing.pricePerKgGhs.toString());
      setQuantityText(existingListing.quantityKg.toString());
      setUnitOfMeasure("kg"); // Default unit in backend
      setCategory("Vegetables");

      const name = existingListing.vegetableType.toLowerCase();
      if (name.includes("tomato")) setCategory("Fruits");
      else if (name.includes("pepper") || name.includes("chili")) setCategory("Vegetables");
      else if (name.includes("cabbage") || name.includes("lettuce")) setCategory("Leafy");
      else if (name.includes("onion")) setCategory("Vegetables");
      else if (name.includes("yam") || name.includes("potato")) setCategory("Roots");
      setImages(existingListing.images || []);
      /* eslint-enable react-hooks/set-state-in-effect */
      if (existingListing.farmerId) {
        setSelectedFarmerId(existingListing.farmerId);
      }
    }
  }, [existingListing]);

  // Auto-detect category based on name input
  const handleCropNameChange = (text: string) => {
    setCropName(text);
    const normalized = text.toLowerCase().trim();
    if (normalized.length >= 2) {
      if (normalized.includes("tomato")) {
        setCategory("Fruits");
      } else if (normalized.includes("pepper") || normalized.includes("chili")) {
        setCategory("Vegetables");
      } else if (normalized.includes("cabbage") || normalized.includes("lettuce")) {
        setCategory("Leafy");
      } else if (normalized.includes("onion")) {
        setCategory("Vegetables");
      } else if (normalized.includes("yam") || normalized.includes("cassava")) {
        setCategory("Roots");
      } else if (normalized.includes("potato")) {
        setCategory("Roots");
      } else if (normalized.includes("bean") || normalized.includes("pea")) {
        setCategory("Legumes");
      }
    }
  };

  const parsedPrice = useMemo(() => {
    const parsed = Number.parseFloat(priceText);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [priceText]);

  const parsedQuantity = useMemo(() => {
    const parsed = Number.parseFloat(quantityText);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [quantityText]);

  const hasValidListing =
    cropName.trim().length >= 2 &&
    category &&
    parsedPrice > 0 &&
    parsedQuantity > 0;

  // Fetch packaging suggestions dynamically
  const { data: packagingOptions } = useRecommendPackaging(cropName.trim());
  const recommendedPackagingId = packagingOptions?.[0]?.id;
  const recommendedPackagingLabel = packagingOptions?.[0]?.label;

  const handlePickImage = async () => {
    const remainingSlots = MAX_LISTING_IMAGES - images.length;
    if (remainingSlots <= 0) {
      Alert.alert("Image Limit Reached", `A listing can include up to ${MAX_LISTING_IMAGES} photos.`, [], { type: "warning" });
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow gallery permissions to select produce photos.", [], { type: "warning" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      try {
        const uploadPromises = result.assets.slice(0, remainingSlots).map(async (asset) => {
          const uploadRes = await uploadImageMutation.mutateAsync(asset.uri);
          return uploadRes.url;
        });
        const urls = await Promise.all(uploadPromises);
        setImages((current) => [...current, ...urls].slice(0, MAX_LISTING_IMAGES));
      } catch (err: any) {
        Alert.alert("Upload Failed", err.message || "Failed to upload one or more images.", [], { type: "error" });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((current) => current.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = () => {
    if (!hasValidListing) return;

    if (isAgent && !selectedFarmerId && !isEditMode) {
      Alert.alert("Validation", "Please select a farmer client to list on behalf of.", [], { type: "warning" });
      return;
    }

    const harvestDate = new Date().toISOString().split("T")[0]; // default to today
    const submitData = {
      vegetable_type: cropName.trim().toLowerCase(),
      quantity_kg: parsedQuantity,
      price_per_kg_ghs: parsedPrice,
      harvest_date: harvestDate,
      images: images,
      recommended_packaging_id: recommendedPackagingId,
      location: { lat: 5.7023, lng: -0.0194 }, // default Accra coordinate
      supports_delivery: true,
      supports_pickup: true,
      farmer_id: isAgent ? selectedFarmerId : undefined,
    };

    if (isEditMode && id) {
      updateListingMutation.mutate({
        id,
        data: submitData
      }, {
        onSuccess: () => {
          setListingPosted(true);
        },
        onError: (err: any) => {
          Alert.alert("Failed to Update", err.error?.message || "Could not update listing.", [], { type: "error" });
        }
      });
    } else {
      createListingMutation.mutate(submitData, {
        onSuccess: () => {
          setListingPosted(true);
        },
        onError: (err: any) => {
          Alert.alert("Failed to Post", err.error?.message || "Could not create listing.", [], { type: "error" });
        }
      });
    }
  };

  const handleReset = () => {
    setCropName("");
    setDescription("");
    setPriceText("");
    setQuantityText("");
    setCategory("Vegetables");
    setUnitOfMeasure("kg");
    setImages([]);
    setListingPosted(false);
  };

  const previewColor = colorMap[category] ?? colorMap.Vegetables;

  return (
    <View className="flex-1 bg-white">
      {/* Custom Header */}
      <View
        className="flex-row items-center gap-4 bg-white px-5 pb-5 border-b border-gray-100"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <Pressable
          accessibilityLabel="Go back"
          className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200"
          onPress={() => {
            if (listingPosted) {
              router.replace("/(tabs)/listings");
            } else {
              router.back();
            }
          }}
        >
          <NavArrowLeft color="#111827" width={24} height={24} strokeWidth={2.5} />
        </Pressable>
        <View>
          <Text className="text-2xl font-black text-gray-950">
            {listingPosted 
              ? (isEditMode ? "Listing Updated!" : "Listing Posted!") 
              : (isEditMode ? "Edit Listing" : "New Listing")}
          </Text>
          <Text className="text-sm font-semibold text-gray-400">
            {listingPosted ? "Details uploaded to VegeLink" : "Fill in your produce details"}
          </Text>
        </View>
      </View>

      {listingPosted ? (
        /* ── SUCCESS STATE ── */
        <View className="flex-1 flex justify-center items-center px-6 py-8">
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-green-50 justify-center items-center shadow-md border border-green-100">
              <View className="w-18 h-18 rounded-full bg-green-800 justify-center items-center shadow-lg">
                <Check color="white" width={32} height={32} strokeWidth={3} />
              </View>
            </View>
            <Text className="text-3xl font-black text-gray-950 mt-6 text-center">
              Listing {isEditMode ? "Updated!" : "Posted!"}
            </Text>
            <Text className="text-gray-500 text-center text-base mt-2 leading-6 px-4">
              <Text className="font-black text-gray-900">{cropName}</Text> is now live on VegeLink. Buyers can find and order your produce.
            </Text>
          </View>

          {/* Success summary card */}
          <View className="w-full p-4 rounded-3xl bg-green-50 border border-green-150 flex-row items-center gap-4 mb-8">
            <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center shadow-sm overflow-hidden">
              {images[0] ? (
                <Image source={{ uri: images[0] }} className="h-full w-full" />
              ) : (
                <MediaImage color="#15803D" width={24} height={24} strokeWidth={2} />
              )}
            </View>
            <View className="flex-1 justify-center">
              <Text className="font-black text-gray-900 text-base">{cropName}</Text>
              <Text className="text-sm font-bold text-green-700 mt-0.5">
                GH₵{priceText}/{unitOfMeasure} · {quantityText} {unitOfMeasure}s available
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="w-full gap-3">
            {!isEditMode && (
              <Pressable
                onPress={handleReset}
                className="w-full h-16 rounded-2xl bg-green-800 flex-row items-center justify-center gap-2 active:bg-green-900 shadow-md shadow-green-900/10"
              >
                <PlusCircle color="white" width={20} height={20} strokeWidth={2.5} />
                <Text className="text-white font-black text-base">Add Another Listing</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.replace("/(tabs)/listings")}
              className="w-full h-14 rounded-2xl border-2 border-gray-200 bg-white items-center justify-center active:bg-gray-50"
            >
              <Text className="text-gray-600 font-black text-base">View My Listings</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* ── FORM STATE ── */
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pt-6 pb-28 gap-5"
          >
            {/* Agent Farmer Selection Section */}
            {isAgent && !isEditMode && (
              <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                  Select Farmer Client *
                </Text>
                <Pressable
                  onPress={() => setIsFarmerModalOpen(true)}
                  className="h-16 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:bg-gray-100"
                >
                  <Text className={`text-base font-extrabold ${selectedFarmerId ? "text-gray-950" : "text-gray-400"}`}>
                    {selectedFarmerId
                      ? farmersList.find((f) => f.id === selectedFarmerId)
                        ? `${farmersList.find((f) => f.id === selectedFarmerId)?.firstName} ${farmersList.find((f) => f.id === selectedFarmerId)?.lastName}`
                        : "Selected Farmer"
                      : "Select represented farmer…"}
                  </Text>
                  <NavArrowDown color="#9CA3AF" width={20} height={20} strokeWidth={2} />
                </Pressable>
              </View>
            )}

            {/* Name Input */}
            <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                  Produce Name *
                </Text>
                <TextInput
                  value={cropName}
                  onChangeText={handleCropNameChange}
                  placeholder="e.g. Roma Tomatoes"
                  placeholderTextColor="#9CA3AF"
                  className="h-16 rounded-2xl border border-gray-250 bg-gray-50 px-4 text-base font-extrabold text-gray-950"
                />
            </View>

            {/* Images Uploader Row */}
            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                Produce Photos ({images.length}/{MAX_LISTING_IMAGES})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                {/* Upload box */}
                {images.length < MAX_LISTING_IMAGES && (
                  <Pressable
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                    className="w-20 h-20 rounded-2xl border border-dashed border-gray-300 bg-gray-50 items-center justify-center mr-3 active:bg-gray-100"
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#15803D" />
                    ) : (
                      <>
                        <Camera color="#9CA3AF" width={22} height={22} strokeWidth={2} />
                        <Text className="text-[10px] font-black text-gray-400 mt-1">Add Photo</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {/* Picked image thumbnails */}
                {images.map((imgUrl, index) => (
                  <View key={imgUrl} className="relative w-20 h-20 rounded-2xl overflow-hidden mr-3">
                    <Image source={{ uri: imgUrl }} className="w-full h-full" />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full items-center justify-center active:bg-black"
                    >
                      <Xmark color="#FFFFFF" width={12} height={12} strokeWidth={3} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Category Selector */}
            <View>
              <Text className="mb-2.5 text-xs font-black uppercase text-gray-400">
                Category *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`rounded-2xl px-4 py-3 border ${
                        isActive ? "border-green-800 bg-green-800" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`text-sm font-black ${
                          isActive ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Price and Per Row */}
            <View className="flex-row gap-4">
              {/* Price Column */}
              <View className="flex-[2]">
                <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                  Price (GH₵) *
                </Text>
                <View className="h-16 flex-row items-center rounded-2xl border border-gray-250 bg-gray-50 px-4">
                  <Text className="text-base font-extrabold text-gray-400 mr-1.5">
                    GH₵
                  </Text>
                  <TextInput
                    value={priceText}
                    onChangeText={setPriceText}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    className="flex-1 text-base font-extrabold text-gray-950 p-0"
                  />
                </View>
              </View>

              {/* Per Dropdown */}
              <View className="flex-1">
                <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                  Per
                </Text>
                <Pressable
                  onPress={() => setIsUnitModalOpen(true)}
                  className="h-16 flex-row items-center justify-between rounded-2xl border border-gray-250 bg-gray-50 px-4 active:bg-gray-100"
                >
                  <Text className="text-base font-extrabold text-gray-950">
                    {unitOfMeasure}
                  </Text>
                  <NavArrowDown color="#9CA3AF" width={18} height={18} strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            {/* Available Quantity */}
            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                Available Quantity ({unitOfMeasure}s) *
              </Text>
              <View className="h-16 flex-row items-center rounded-2xl border border-gray-250 bg-gray-50 px-4">
                <Pin color="#9CA3AF" width={20} height={20} className="mr-3" />
                <TextInput
                  value={quantityText}
                  onChangeText={setQuantityText}
                  placeholder="e.g. 500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-base font-extrabold text-gray-950 p-0"
                />
                <Text className="text-base font-bold text-gray-400 ml-2">
                  {unitOfMeasure}s
                </Text>
              </View>
            </View>

            {/* Packaging Recommendation Tip */}
            {recommendedPackagingLabel ? (
              <View className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex-row items-center gap-3">
                <Text className="text-xl">💡</Text>
                <View className="flex-1">
                  <Text className="text-xs font-black uppercase text-amber-800">
                    Recommended Packaging
                  </Text>
                  <Text className="text-sm font-semibold text-amber-900 mt-0.5">
                    {recommendedPackagingLabel} (increases protection during transit)
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Description */}
            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                Description (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your produce — variety, how it was grown, harvest date..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="min-h-24 rounded-2xl border border-gray-250 bg-gray-50 px-4 py-4 text-base font-extrabold text-gray-950"
              />
            </View>

            {/* Preview Card */}
            {cropName && priceText ? (
              <View className="p-4 rounded-3xl bg-gray-50 border border-gray-200">
                <Text className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">
                  Preview
                </Text>
                <View className="flex-row items-center gap-4">
                  <View className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden" style={{ backgroundColor: previewColor.tintColor }}>
                    {images[0] ? (
                      <Image source={{ uri: images[0] }} className="h-full w-full" />
                    ) : (
                      <MediaImage color={previewColor.accentColor} width={26} height={26} strokeWidth={2} />
                    )}
                  </View>
                  <View className="justify-center">
                    <Text className="font-black text-gray-950 text-base">{cropName}</Text>
                    <Text
                      className="text-sm font-black mt-0.5"
                      style={{ color: previewColor.accentColor }}
                    >
                      GH₵{priceText}/{unitOfMeasure}
                    </Text>
                    {quantityText ? (
                      <Text className="text-xs text-gray-400 font-bold mt-0.5">
                        {quantityText} {unitOfMeasure}s available
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Sticky Bottom CTA Button */}
      {!listingPosted && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={!hasValidListing || createListingMutation.isPending || updateListingMutation.isPending}
            className={`h-16 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90 ${
              hasValidListing ? "bg-green-800" : "bg-[#C0D5C7]"
            }`}
          >
            {createListingMutation.isPending || updateListingMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <PlusCircle color="white" width={20} height={20} strokeWidth={2.5} />
                <Text className="text-base font-black text-white">
                  {isEditMode ? "Save Changes" : "Post Listing"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Unit Selector Modal */}
      <Modal visible={isUnitModalOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/45 justify-center items-center px-6"
          onPress={() => setIsUnitModalOpen(false)}
        >
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-lg font-black text-gray-950 mb-4">Select Unit</Text>
            <View className="gap-2">
              {unitOptions.map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => {
                    setUnitOfMeasure(unit);
                    setIsUnitModalOpen(false);
                  }}
                  className={`py-3.5 px-4 rounded-xl active:bg-gray-150 ${
                    unitOfMeasure === unit ? "bg-green-50" : ""
                  }`}
                >
                  <Text
                    className={`text-base font-black ${
                      unitOfMeasure === unit ? "text-green-800" : "text-gray-700"
                    }`}
                  >
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Farmer Client Picker Modal */}
      <Modal visible={isFarmerModalOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/45 justify-end"
          onPress={() => setIsFarmerModalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pt-5 pb-8 gap-4 max-h-[75%]"
            style={{ paddingBottom: Math.max(insets.bottom, 28) }}
          >
            <Text className="text-2xl font-black text-gray-950 mb-2">Select Farmer Client</Text>
            
            {farmersList.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-base font-bold text-gray-400 text-center">
                  No clients registered yet. Please go to the Clients tab to add one.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="gap-2">
                {farmersList.map((farmer) => {
                  const name = `${farmer.firstName} ${farmer.lastName}`;
                  const active = selectedFarmerId === farmer.id;
                  return (
                    <Pressable
                      key={farmer.id}
                      onPress={() => {
                        setSelectedFarmerId(farmer.id);
                        setIsFarmerModalOpen(false);
                      }}
                      className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                        active
                          ? "bg-green-50 border-green-800"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <View>
                        <Text className={`text-base font-black ${active ? "text-green-800" : "text-gray-950"}`}>
                          {name}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {farmer.phone} · {farmer.region || "No Region"}
                        </Text>
                      </View>
                      {active && <Check color="#15803D" width={20} height={20} strokeWidth={2.5} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              className="mt-2 rounded-2xl border border-gray-200 py-4"
              onPress={() => setIsFarmerModalOpen(false)}
            >
              <Text className="text-center font-black text-gray-600">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
