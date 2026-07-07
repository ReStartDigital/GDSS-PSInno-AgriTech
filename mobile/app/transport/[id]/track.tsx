import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { LiveTrackingMap } from "@/components/transport/LiveTrackingMap";

export default function TrackTransportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Live Tracking" />
      <LiveTrackingMap transportId={id} />
    </View>
  );
}
