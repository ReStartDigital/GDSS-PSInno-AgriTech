import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { OTPInput } from "@/components/common/OTPInput";
import { vlClassNames } from "@/lib/design-system";
import { NavArrowLeft } from "iconoir-react-native";

const otpLength = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const { firstName, lastName, phone, role } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
  }>();
  const [otp, setOtp] = useState("");

  const safePhone = phone?.trim() || "+233059983273";
  const safeRole: UserRole = role ?? "farmer";
  const isOtpReady = otp.length === otpLength;

  const handleVerify = () => {
    if (!isOtpReady) {
      return;
    }

    router.push({
      pathname: "/(auth)/details",
      params: {
        firstName,
        lastName,
        phone: safePhone,
        role: safeRole,
      },
    });
  };

  const handleResend = () => {
    Alert.alert("Code sent", `A new code was sent to ${safePhone}.`);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(auth)/phone",
      params: { role: safeRole },
    });
  };

  return (
    <View className={vlClassNames.screen}>
      <View className="flex-1 px-6 pb-10 pt-9">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Go back"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white active:bg-gray-100"
            style={{
              borderColor: "#111827",
              borderWidth: 2,
              shadowColor: "#111827",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            onPress={handleBack}
          >
            <NavArrowLeft color="#111827" width={24} height={24} strokeWidth={2.5} />
          </Pressable>
          <View className="flex-1 gap-2">
            <View className="flex-row gap-2">
              <ProgressStep active />
              <ProgressStep active />
              <ProgressStep />
            </View>
            <Text className="text-xs font-black text-gray-400">Step 2 of 3</Text>
          </View>
        </View>

        <Text className="mt-8 text-4xl font-black leading-tight text-gray-950">
          Enter the code
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          Sent to <Text className="font-black text-gray-950">{safePhone}</Text>
        </Text>

        <View className="mt-9">
          <OTPInput value={otp} onChange={setOtp} length={otpLength} />
        </View>

        <View className="mt-10 items-center">
          <Pressable className="flex-row items-center" onPress={handleResend}>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <View className="h-8 w-8 items-center justify-center rounded-full border-4 border-gray-200">
                <Text className="text-xs font-black text-gray-700">26</Text>
              </View>
            </View>
            <Text className="ml-3 text-sm font-black text-gray-400">
              Resend in 26s
            </Text>
          </Pressable>

          <Text className="mt-5 max-w-xs text-center text-xs font-semibold leading-5 text-gray-400">
            Did not receive the code? Check your network and try again.
          </Text>
        </View>

        <View className="mt-auto">
          <Pressable
            className={isOtpReady ? vlClassNames.primaryButton : vlClassNames.mutedButton}
            onPress={handleVerify}
          >
            <Text
              className={
                isOtpReady
                  ? vlClassNames.primaryButtonText
                  : vlClassNames.mutedButtonText
              }
            >
              Verify  -&gt;
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ProgressStep({ active = false }: { active?: boolean }) {
  return (
    <View
      className={`h-1.5 flex-1 rounded-full ${
        active ? "bg-green-800" : "bg-gray-100"
      }`}
    />
  );
}
