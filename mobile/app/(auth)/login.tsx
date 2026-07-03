import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-2 text-3xl font-bold text-green-900">VegeLink Ghana</Text>
      <Text className="mb-8 text-center text-gray-600">
        Farmer-to-buyer marketplace for fresh vegetables
      </Text>
      <Link href="/(auth)/register" asChild>
        <Pressable className="w-full rounded-lg bg-green-800 py-3">
          <Text className="text-center font-semibold text-white">Get Started</Text>
        </Pressable>
      </Link>
    </View>
  );
}
