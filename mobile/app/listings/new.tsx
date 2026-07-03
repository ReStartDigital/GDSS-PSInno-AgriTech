import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { CameraImagePicker } from "@/components/listings/CameraImagePicker";
import { GPSLocationButton } from "@/components/listings/GPSLocationButton";

export default function NewListingScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="New Listing" />
      <View className="flex-1 px-6 pt-6">
        <CameraImagePicker />
        <GPSLocationButton />
        <Text className="mt-4 text-gray-600">Fill in produce details to create a listing.</Text>
      </View>
    </View>
  );
}
