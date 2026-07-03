import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-6 text-2xl font-bold text-green-900">Create Account</Text>
      <Link href="/(auth)/verify" asChild>
        <Pressable className="w-full rounded-lg bg-green-800 py-3">
          <Text className="text-center font-semibold text-white">Continue</Text>
        </Pressable>
      </Link>
    </View>
  );
}
