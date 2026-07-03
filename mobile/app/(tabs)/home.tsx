import { View, Text } from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Home" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-gray-700">Welcome to VegeLink Ghana</Text>
      </View>
    </View>
  );
}
