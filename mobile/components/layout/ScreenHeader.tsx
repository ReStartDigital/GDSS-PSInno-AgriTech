import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-gray-200 bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Text className="text-xl font-bold text-green-900">{title}</Text>
    </View>
  );
}
