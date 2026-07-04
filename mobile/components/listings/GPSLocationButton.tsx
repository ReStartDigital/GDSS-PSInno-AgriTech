import { Pressable, Text, View } from "react-native";
import * as Location from "expo-location";
import { useState } from "react";
import { Pin, Check } from "iconoir-react-native";

export function GPSLocationButton() {
  const [coords, setCoords] = useState<string | null>(null);

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setCoords(
      `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
    );
  };

  return (
    <Pressable
      className={`flex-row items-center justify-center gap-3 rounded-2xl py-4 active:opacity-80 ${
        coords ? "bg-green-100" : "bg-gray-100"
      }`}
      onPress={captureLocation}
    >
      {coords ? (
        <Check color="#166534" width={20} height={20} strokeWidth={2.5} />
      ) : (
        <Pin color="#6B7280" width={20} height={20} strokeWidth={2} />
      )}
      <Text
        className={`text-sm font-black ${
          coords ? "text-green-800" : "text-gray-600"
        }`}
      >
        {coords ? `Location: ${coords}` : "Capture GPS Location"}
      </Text>
    </Pressable>
  );
}
