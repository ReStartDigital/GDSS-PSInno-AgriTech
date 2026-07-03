import { Pressable, Text } from "react-native";
import * as Location from "expo-location";
import { useState } from "react";

export function GPSLocationButton() {
  const [coords, setCoords] = useState<string | null>(null);

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setCoords(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
  };

  return (
    <Pressable className="rounded-lg bg-green-100 py-3" onPress={captureLocation}>
      <Text className="text-center font-medium text-green-900">
        {coords ? `Location: ${coords}` : "Capture GPS Location"}
      </Text>
    </Pressable>
  );
}
