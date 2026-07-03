import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoMoSelector } from "@/components/common/MoMoSelector";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { findMarketplaceListing } from "@/lib/marketplace-data";

const packagingOptions = [
  { label: "Recommended", multiplier: 0.08, note: "Best protection for this crop" },
  { label: "Buyer pickup packaging", multiplier: 0.03, note: "Lowest cost, buyer handles more risk" },
  { label: "Premium crates", multiplier: 0.12, note: "Stronger handling for longer delivery" },
] as const;

const deliveryOptions = [
  { label: "Transport matched", costPerKm: 2.5, note: "VegeLink assigns a nearby transporter" },
  { label: "Buyer pickup", costPerKm: 0, note: "Collect directly from the farmer" },
] as const;

export default function ListingOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = findMarketplaceListing(id);
  const [quantityText, setQuantityText] = useState("10");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState<string>(
    packagingOptions[0].label,
  );
  const [selectedDelivery, setSelectedDelivery] = useState<string>(
    deliveryOptions[0].label,
  );
  const [selectedMoMo, setSelectedMoMo] = useState<string>();

  const quantity = useMemo(() => {
    const parsed = Number.parseFloat(quantityText.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [quantityText]);

  const selectedPackagingOption =
    packagingOptions.find((option) => option.label === selectedPackaging) ??
    packagingOptions[0];
  const selectedDeliveryOption =
    deliveryOptions.find((option) => option.label === selectedDelivery) ??
    deliveryOptions[0];

  if (!listing) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Place Order" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-semibold text-gray-900">
            Listing not found
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Return to the marketplace and choose an available listing.
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

  const produceSubtotal = Math.max(quantity, 0) * listing.pricePerUnit;
  const packagingCost = produceSubtotal * selectedPackagingOption.multiplier;
  const transportCost = selectedDeliveryOption.costPerKm * listing.distanceKm;
  const serviceFee = produceSubtotal > 0 ? 2 : 0;
  const totalAmount = produceSubtotal + packagingCost + transportCost + serviceFee;
  const hasValidQuantity = quantity > 0 && quantity <= listing.availableQuantity;
  const canSubmit =
    hasValidQuantity &&
    deliveryAddress.trim().length >= 8 &&
    selectedMoMo !== undefined;

  const handleQuantityStep = (direction: "decrease" | "increase") => {
    const nextQuantity =
      direction === "increase"
        ? Math.min(quantity + 5, listing.availableQuantity)
        : Math.max(quantity - 5, 1);

    setQuantityText(String(Number.isInteger(nextQuantity) ? nextQuantity : nextQuantity.toFixed(2)));
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      Alert.alert(
        "Complete order details",
        "Add a valid quantity, delivery address, and MoMo provider before continuing.",
      );
      return;
    }

    Alert.alert(
      "Order prepared",
      `Ready to send ${quantity} ${listing.unitOfMeasure} of ${listing.cropName} for GHS ${totalAmount.toFixed(2)}.`,
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Place Order" />
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-green-700">
            Buyer checkout
          </Text>
          <View className="mt-2 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-2xl font-black text-green-950">
                {listing.cropName}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                {listing.farmer.fullName} - {listing.farmer.locationLabel}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xl font-black text-green-900">
                GHS {listing.pricePerUnit}
              </Text>
              <Text className="text-xs text-gray-500">
                per {listing.unitOfMeasure}
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-lg bg-green-50 p-3">
            <Text className="text-sm font-semibold text-green-900">
              Farmer confirmation comes first
            </Text>
            <Text className="mt-1 text-sm leading-5 text-green-900">
              After checkout, the farmer confirms by app, SMS, trusted-buyer
              rules, or an assigned agent before transport starts.
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Quantity</Text>
          <Text className="mt-1 text-sm text-gray-600">
            {listing.availableQuantity} {listing.unitOfMeasure} available
          </Text>
          <View className="mt-4 flex-row items-center gap-3">
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-lg border border-gray-300"
              onPress={() => handleQuantityStep("decrease")}
            >
              <Text className="text-2xl font-bold text-gray-900">-</Text>
            </Pressable>
            <TextInput
              value={quantityText}
              onChangeText={setQuantityText}
              keyboardType="decimal-pad"
              className="h-12 flex-1 rounded-lg border border-gray-300 px-4 text-center text-lg font-bold text-gray-950"
            />
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-lg border border-gray-300"
              onPress={() => handleQuantityStep("increase")}
            >
              <Text className="text-2xl font-bold text-gray-900">+</Text>
            </Pressable>
          </View>
          {!hasValidQuantity ? (
            <Text className="mt-2 text-sm font-semibold text-red-700">
              Enter a quantity between 1 and {listing.availableQuantity}.
            </Text>
          ) : null}
        </View>

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Delivery address</Text>
          <TextInput
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Market, restaurant, shop, or home address"
            placeholderTextColor="#6B7280"
            multiline
            className="mt-3 min-h-24 rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-950"
            textAlignVertical="top"
          />
        </View>

        <ChoiceGroup
          title="Packaging"
          selected={selectedPackaging}
          onSelect={setSelectedPackaging}
          options={packagingOptions.map((option) => ({
            label: option.label,
            detail:
              option.label === "Recommended"
                ? `${listing.packagingRecommendation} - ${option.note}`
                : option.note,
          }))}
        />

        <ChoiceGroup
          title="Transport"
          selected={selectedDelivery}
          onSelect={setSelectedDelivery}
          options={deliveryOptions.map((option) => ({
            label: option.label,
            detail: option.note,
          }))}
        />

        <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-lg font-bold text-green-950">Payment method</Text>
          <Text className="mb-3 mt-1 text-sm text-gray-600">
            Paystack will process the selected mobile money provider.
          </Text>
          <MoMoSelector selected={selectedMoMo} onSelect={setSelectedMoMo} />
        </View>

        <View className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <Text className="text-lg font-bold text-green-950">Order summary</Text>
          <SummaryRow label="Produce" value={`GHS ${produceSubtotal.toFixed(2)}`} />
          <SummaryRow label="Packaging" value={`GHS ${packagingCost.toFixed(2)}`} />
          <SummaryRow label="Transport" value={`GHS ${transportCost.toFixed(2)}`} />
          <SummaryRow label="Service fee" value={`GHS ${serviceFee.toFixed(2)}`} />
          <View className="mt-4 flex-row items-center justify-between border-t border-green-200 pt-4">
            <Text className="text-base font-bold text-green-950">Total</Text>
            <Text className="text-2xl font-black text-green-950">
              GHS {totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <Pressable
          className={`mt-5 rounded-lg py-4 ${
            canSubmit ? "bg-green-800 active:bg-green-900" : "bg-gray-300"
          }`}
          onPress={handleSubmit}
        >
          <Text
            className={`text-center text-base font-bold ${
              canSubmit ? "text-white" : "text-gray-600"
            }`}
          >
            Prepare Order
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ChoiceGroup({
  title,
  selected,
  onSelect,
  options,
}: {
  title: string;
  selected: string;
  onSelect: (value: string) => void;
  options: { label: string; detail: string }[];
}) {
  return (
    <View className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <Text className="text-lg font-bold text-green-950">{title}</Text>
      <View className="mt-3 gap-2">
        {options.map((option) => {
          const isActive = selected === option.label;

          return (
            <Pressable
              key={option.label}
              className={`rounded-lg border p-3 ${
                isActive ? "border-green-800 bg-green-50" : "border-gray-300"
              }`}
              onPress={() => onSelect(option.label)}
            >
              <Text
                className={`font-semibold ${
                  isActive ? "text-green-950" : "text-gray-950"
                }`}
              >
                {option.label}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">{option.detail}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 flex-row items-center justify-between">
      <Text className="text-sm text-green-900">{label}</Text>
      <Text className="text-sm font-semibold text-green-950">{value}</Text>
    </View>
  );
}
