import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavArrowLeft, NavArrowDown, Pin, Check, PlusCircle } from "iconoir-react-native";
import { useListingsStore } from "@/lib/listings-store";

const unitOptions = ["kg", "crate", "basket", "head", "bunch", "sack"] as const;

const LISTING_EMOJIS = [
  "🍅", "🌶️", "🥬", "🧅", "🍠", "🥔", "🥕", "🌽", "🫛", 
  "🥦", "🍎", "🍌", "🍉", "🍍", "🥑", "🥭", "🍊", "🍐", "🍋"
] as const;

const categories = ["Vegetables", "Roots", "Leafy", "Legumes", "Fruits"] as const;

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
  const { listings, addListing, updateListing } = useListingsStore();

  const isEditMode = !!id;
  const existingListing = useMemo(() => {
    if (!id) return null;
    return listings.find((l) => l.id === id);
  }, [id, listings]);

  const [cropName, setCropName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🍅");
  const [category, setCategory] = useState<(typeof categories)[number]>("Vegetables");
  const [unitOfMeasure, setUnitOfMeasure] = useState<(typeof unitOptions)[number]>("kg");

  // Success state
  const [listingPosted, setListingPosted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Load existing listing data in edit mode
  useEffect(() => {
    if (existingListing) {
      setCropName(existingListing.cropName);
      setDescription(existingListing.description || "");
      setPriceText(existingListing.pricePerUnit.toString());
      setQuantityText(existingListing.availableQuantity.toString());
      setUnitOfMeasure(existingListing.unitOfMeasure as any);
      setCategory(existingListing.category as any);

      // Try to deduce emoji
      const name = existingListing.cropName.toLowerCase();
      const match = LISTING_EMOJIS.find((pe) => name.includes(pe) || pe === existingListing.harvestLabel);
      if (match) {
        setSelectedEmoji(match);
      } else {
        // Fallback checks
        if (name.includes("tomato")) setSelectedEmoji("🍅");
        else if (name.includes("pepper")) setSelectedEmoji("🌶️");
        else if (name.includes("cabbage")) setSelectedEmoji("🥬");
      }
    }
  }, [existingListing]);

  // Auto-detect emoji and category based on name input
  const handleCropNameChange = (text: string) => {
    setCropName(text);
    const normalized = text.toLowerCase().trim();
    if (normalized.length >= 2) {
      if (normalized.includes("tomato")) {
        setSelectedEmoji("🍅");
        setCategory("Fruits");
      } else if (normalized.includes("pepper") || normalized.includes("chili")) {
        setSelectedEmoji("🌶️");
        setCategory("Vegetables");
      } else if (normalized.includes("cabbage") || normalized.includes("lettuce")) {
        setSelectedEmoji("🥬");
        setCategory("Leafy");
      } else if (normalized.includes("onion")) {
        setSelectedEmoji("🧅");
        setCategory("Vegetables");
      } else if (normalized.includes("yam") || normalized.includes("cassava")) {
        setSelectedEmoji("🍠");
        setCategory("Roots");
      } else if (normalized.includes("potato")) {
        setSelectedEmoji("🥔");
        setCategory("Roots");
      } else if (normalized.includes("bean") || normalized.includes("pea")) {
        setSelectedEmoji("🫛");
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

  const handleSubmit = () => {
    if (!hasValidListing) return;

    const cm = colorMap[category] ?? colorMap.Vegetables;

    if (isEditMode && existingListing) {
      updateListing(existingListing.id, {
        cropName: cropName.trim(),
        description: description.trim(),
        pricePerUnit: parsedPrice,
        availableQuantity: parsedQuantity,
        category,
        unitOfMeasure,
        accentColor: cm.accentColor,
        tintColor: cm.tintColor,
        harvestLabel: selectedEmoji, // Store emoji in harvestLabel or similar, or deduce dynamically
      });
    } else {
      addListing({
        cropName: cropName.trim(),
        description: description.trim(),
        pricePerUnit: parsedPrice,
        availableQuantity: parsedQuantity,
        category,
        unitOfMeasure,
        status: "available",
        imageUrls: [],
        harvestLabel: selectedEmoji,
        packagingRecommendation: unitOfMeasure === "kg" ? "Ventilated crates" : "Plastic baskets",
        accentColor: cm.accentColor,
        tintColor: cm.tintColor,
      });
    }

    setListingPosted(true);
  };

  const handleReset = () => {
    setCropName("");
    setDescription("");
    setPriceText("");
    setQuantityText("");
    setSelectedEmoji("🍅");
    setCategory("Vegetables");
    setUnitOfMeasure("kg");
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
            <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center shadow-sm">
              <Text className="text-3xl">{selectedEmoji}</Text>
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
            {/* Emoji + Name Row */}
            <View className="flex-row gap-4">
              {/* Emoji Selector */}
              <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                  Icon
                </Text>
                <Pressable
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 items-center justify-center active:bg-gray-100"
                  style={{
                    borderColor: showEmojiPicker ? "#0F6A2B" : "#E5E7EB",
                    borderWidth: showEmojiPicker ? 2 : 1,
                  }}
                >
                  <Text className="text-3xl">{selectedEmoji}</Text>
                </Pressable>
              </View>

              {/* Name Input */}
              <View className="flex-1">
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
            </View>

            {/* Emoji Picker Grid */}
            {showEmojiPicker && (
              <View className="bg-white rounded-3xl border border-green-100 p-4 shadow-sm shadow-green-900/5">
                <View className="flex-row flex-wrap gap-2 justify-between">
                  {LISTING_EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      onPress={() => {
                        setSelectedEmoji(e);
                        setShowEmojiPicker(false);
                      }}
                      className="w-10 h-10 rounded-xl items-center justify-center active:scale-90"
                      style={{
                        backgroundColor: selectedEmoji === e ? "#E8F5E9" : "transparent",
                      }}
                    >
                      <Text className="text-2xl">{e}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

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
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: previewColor.tintColor }}
                  >
                    <Text className="text-3xl">{selectedEmoji}</Text>
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
            disabled={!hasValidListing}
            className={`h-16 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90 ${
              hasValidListing ? "bg-green-800" : "bg-[#C0D5C7]"
            }`}
          >
            <PlusCircle color="white" width={20} height={20} strokeWidth={2.5} />
            <Text className="text-base font-black text-white">
              {isEditMode ? "Save Changes" : "Post Listing"}
            </Text>
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
    </View>
  );
}
