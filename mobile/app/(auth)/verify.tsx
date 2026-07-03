import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@vegelink/shared";

export default function VerifyScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleVerify = () => {
    setAuth(
      { id: "1", phone: "+233000000000", role: "buyer", fullName: "Demo User" },
      "demo-token",
    );
    router.replace("/(tabs)/home");
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-6 text-2xl font-bold text-green-900">Verify OTP</Text>
      <Pressable className="w-full rounded-lg bg-green-800 py-3" onPress={handleVerify}>
        <Text className="text-center font-semibold text-white">Verify (Demo)</Text>
      </Pressable>
    </View>
  );
}
