import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white px-5 pb-5 shadow-sm"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <Text className="text-3xl font-black text-gray-950">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-sm font-black text-gray-400">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
