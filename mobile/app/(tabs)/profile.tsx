import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@vegelink/shared";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Profile" />
      <View className="flex-1 px-6 pt-6">
        <Text className="text-xl font-semibold text-green-900">
          {user?.fullName ?? "Guest"}
        </Text>
        <Text className="mt-1 text-gray-600">{user?.phone}</Text>
        <Text className="mt-1 capitalize text-gray-500">{user?.role}</Text>
        <Pressable className="mt-8 rounded-lg bg-red-700 py-3" onPress={handleLogout}>
          <Text className="text-center font-semibold text-white">Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
