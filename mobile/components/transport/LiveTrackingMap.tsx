import { View, Text } from "react-native";

interface LiveTrackingMapProps {
  transportId?: string;
}

export function LiveTrackingMap({ transportId }: LiveTrackingMapProps) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-gray-600">Tracking transport {transportId ?? "—"}</Text>
      <Text className="mt-2 text-sm text-gray-500">Live map requires a development build</Text>
    </View>
  );
}
