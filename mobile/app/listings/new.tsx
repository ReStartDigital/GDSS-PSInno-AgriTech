import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { CameraImagePicker } from "@/components/listings/CameraImagePicker";
import { GPSLocationButton } from "@/components/listings/GPSLocationButton";

const unitOptions = ["kg", "crate", "basket", "head", "bunch", "sack"] as const;

const packagingRecommendations: Record<string, string> = {
  tomato: "Ventilated crates",
  tomatoes: "Ventilated crates",
  okra: "Ventilated crates",
  cabbage: "Plastic baskets",
  "garden egg": "Plastic baskets",
  "garden eggs": "Plastic baskets",
  yam: "Bulk sacks",
  pepper: "Ventilated crates",
  lettuce: "Mesh bags",
};

export default function NewListingScreen() {
  const [cropName, setCropName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] =
    useState<(typeof unitOptions)[number]>("kg");
  const [autoConfirmKgText, setAutoConfirmKgText] = useState("");
  const [priceFloorText, setPriceFloorText] = useState("");

  const pricePerUnit = useMemo(() => parseMoney(priceText), [priceText]);
  const availableQuantity = useMemo(
    () => parseMoney(quantityText),
    [quantityText],
  );
  const autoConfirmKg = useMemo(
    () => parseMoney(autoConfirmKgText),
    [autoConfirmKgText],
  );
  const priceFloor = useMemo(() => parseMoney(priceFloorText), [priceFloorText]);
  const normalizedCrop = cropName.trim().toLowerCase();
  const packagingRecommendation =
    packagingRecommendations[normalizedCrop] ?? "Plastic baskets";
  const estimatedGrossValue = pricePerUnit * availableQuantity;
  const hasValidListing =
    cropName.trim().length >= 2 && pricePerUnit > 0 && availableQuantity > 0;

  const handleSubmit = () => {
    if (!hasValidListing) {
      Alert.alert(
        "Complete listing",
        "Add a crop name, price, and available quantity before publishing.",
      );
      return;
    }

    Alert.alert(
      "Listing prepared",
      `${cropName.trim()} is ready to publish at GHS ${pricePerUnit.toFixed(2)} per ${unitOfMeasure}.`,
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="New Listing" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="rounded-lg border border-green-100 bg-green-50 p-4">
          <Text className="text-sm font-semibold uppercase text-green-700">
            Farmer listing
          </Text>
          <Text className="mt-2 text-3xl font-black text-green-950">
            Publish produce
          </Text>
          <Text className="mt-2 text-base leading-6 text-green-900">
            Add the crop, price, quantity, photo, and pickup point buyers need
            before they place an order.
          </Text>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Produce details</Text>
          <Field
            label="Crop name"
            value={cropName}
            onChangeText={setCropName}
            placeholder="Roma Tomatoes"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Freshly harvested, sorted, and ready for pickup"
            multiline
          />
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Price"
                value={priceText}
                onChangeText={setPriceText}
                placeholder="8"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Quantity"
                value={quantityText}
                onChangeText={setQuantityText}
                placeholder="500"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Unit</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {unitOptions.map((unit) => {
              const isActive = unitOfMeasure === unit;

              return (
                <Pressable
                  key={unit}
                  className={`rounded-full border px-4 py-2 ${
                    isActive
                      ? "border-green-800 bg-green-800"
                      : "border-gray-300 bg-white"
                  }`}
                  onPress={() => setUnitOfMeasure(unit)}
                >
                  <Text
                    className={`font-semibold ${
                      isActive ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {unit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Photo and pickup</Text>
          <Text className="mb-3 mt-1 text-sm text-gray-600">
            Add a clear produce photo and capture the pickup location for
            nearby buyers and transporters.
          </Text>
          <CameraImagePicker />
          <GPSLocationButton />
        </View>

        <View className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Text className="text-lg font-bold text-amber-950">
            Order confirmation settings
          </Text>
          <Text className="mt-1 text-sm leading-5 text-amber-950">
            Optional pre-authorisation lets matching buyer orders confirm faster
            while keeping a quantity and price guardrail.
          </Text>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Auto-confirm kg"
                value={autoConfirmKgText}
                onChangeText={setAutoConfirmKgText}
                placeholder="200"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Min price"
                value={priceFloorText}
                onChangeText={setPriceFloorText}
                placeholder="4.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <Text className="text-lg font-bold text-green-950">Listing summary</Text>
          <SummaryRow label="Crop" value={cropName.trim() || "Not set"} />
          <SummaryRow
            label="Price"
            value={`GHS ${pricePerUnit.toFixed(2)} / ${unitOfMeasure}`}
          />
          <SummaryRow
            label="Available"
            value={`${availableQuantity.toFixed(2)} ${unitOfMeasure}`}
          />
          <SummaryRow label="Packaging" value={packagingRecommendation} />
          <SummaryRow
            label="Potential gross"
            value={`GHS ${estimatedGrossValue.toFixed(2)}`}
          />
          <SummaryRow
            label="Pre-auth"
            value={
              autoConfirmKg > 0 || priceFloor > 0
                ? `${autoConfirmKg || 0} kg above GHS ${priceFloor.toFixed(2)}`
                : "Off"
            }
          />
        </View>

        <Pressable
          className={`mt-5 rounded-lg py-4 ${
            hasValidListing ? "bg-green-800 active:bg-green-900" : "bg-gray-300"
          }`}
          onPress={handleSubmit}
        >
          <Text
            className={`text-center text-base font-bold ${
              hasValidListing ? "text-white" : "text-gray-600"
            }`}
          >
            Prepare Listing
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function parseMoney(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-semibold text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-950 ${
          multiline ? "min-h-24" : ""
        }`}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 flex-row items-start justify-between gap-4">
      <Text className="flex-1 text-sm text-green-900">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-green-950">
        {value}
      </Text>
    </View>
  );
}
