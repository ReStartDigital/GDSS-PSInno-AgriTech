import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthUser, UserRole, useAuthStore } from "@vegelink/shared";
import { OTPInput } from "@/components/common/OTPInput";

const demoOtp = "123456";

export default function VerifyScreen() {
  const router = useRouter();
  const { firstName, lastName, phone, role } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
  }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState("");

  const safeFirstName = firstName?.trim() || "Demo";
  const safeLastName = lastName?.trim() || "User";
  const safePhone = phone?.trim() || "+233000000000";
  const safeRole: UserRole = role ?? "buyer";
  const fullName = `${safeFirstName} ${safeLastName}`;
  const isOtpReady = otp.length === demoOtp.length;

  const handleVerify = () => {
    if (otp !== demoOtp) {
      Alert.alert("Invalid code", "Use 123456 for this prototype verification.");
      return;
    }

    const user: AuthUser = {
      id: `demo-${safeRole}`,
      phone: safePhone,
      role: safeRole,
      fullName,
    };

    setAuth(user, "demo-token");
    router.replace("/(tabs)/home");
  };

  const handleResend = () => {
    Alert.alert("OTP sent", `A new code was sent to ${safePhone}.`);
  };

  const handleDemoFill = () => {
    setOtp(demoOtp);
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-sm font-semibold uppercase text-green-700">
        Phone verification
      </Text>
      <Text className="mt-2 text-3xl font-black text-green-950">
        Enter your OTP
      </Text>
      <Text className="mt-2 text-base leading-6 text-gray-600">
        We sent a 6-digit code to {safePhone}. This keeps payments and order
        updates tied to the right person.
      </Text>

      <View className="mt-8 rounded-lg border border-green-100 bg-green-50 p-4">
        <Text className="font-bold text-green-950">{fullName}</Text>
        <Text className="mt-1 capitalize text-green-900">{safeRole}</Text>
      </View>

      <View className="mt-8">
        <OTPInput value={otp} onChange={setOtp} />
      </View>

      <Pressable className="mt-4 py-3" onPress={handleDemoFill}>
        <Text className="text-center font-semibold text-green-800">
          Use prototype code 123456
        </Text>
      </Pressable>

      <Pressable
        className={`mt-5 rounded-lg py-4 ${
          isOtpReady ? "bg-green-800 active:bg-green-900" : "bg-gray-300"
        }`}
        onPress={handleVerify}
      >
        <Text
          className={`text-center text-base font-bold ${
            isOtpReady ? "text-white" : "text-gray-600"
          }`}
        >
          Verify Phone
        </Text>
      </Pressable>

      <Pressable className="mt-4 py-3" onPress={handleResend}>
        <Text className="text-center font-semibold text-gray-700">
          Resend code
        </Text>
      </Pressable>
    </View>
  );
}
