import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { OTPInput } from "@/components/common/OTPInput";
import { ProgressStep } from "@/components/common/ProgressStep";
import { vlClassNames, vlStyles } from "@/lib/design-system";
import { NavArrowLeft, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api-client";

const otpLength = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firstName, middleName, lastName, phone, role, region, language } = useLocalSearchParams<{
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    region?: string;
    language?: string;
  }>();
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const canResend = countdown === 0 && !loading;

  const safePhone = phone?.trim() || "+233059983273";
  const safeRole: UserRole = role ?? "farmer";
  const isOtpReady = otp.length === otpLength && !loading;

  const handleVerify = async () => {
    if (!isOtpReady) {
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/verify-otp", {
        phone: safePhone,
        otp,
      }) as any;

      const registrationToken = res.data?.registration_token;

      if (!registrationToken) {
        throw new Error("Registration token not received from server.");
      }

      router.push({
        pathname: "/(auth)/pin" as any,
        params: {
          firstName,
          middleName,
          lastName,
          phone: safePhone,
          role: safeRole,
          region,
          language,
          registrationToken,
        },
      });
    } catch (err: any) {
      const errMsg = err.error?.message || "Invalid or expired verification code.";
      Alert.alert("Verification Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    try {
      await apiClient.post("/auth/resend-otp", { phone: safePhone });
      setCountdown(30);
      Alert.alert("Code sent", `A new code was sent to ${safePhone}.`);
    } catch (err: any) {
      Alert.alert("Resend Failed", err.error?.message || "Could not resend OTP code.");
    }
  }, [canResend, safePhone]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(auth)/phone",
      params: {
        firstName,
        middleName,
        lastName,
        role: safeRole,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
    <View className={vlClassNames.screen} style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-6 pb-10 pt-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Go back"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200"
            onPress={handleBack}
          >
            <NavArrowLeft color="#111827" width={24} height={24} strokeWidth={2.5} />
          </Pressable>
          <View className="flex-1 gap-2">
            <View className="flex-row gap-2">
              <ProgressStep active />
              <ProgressStep active />
              <ProgressStep active />
              <ProgressStep />
            </View>
            <Text className="text-xs font-black text-gray-400">Step 3 of 4</Text>
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
          <Pressable
            className={`flex-row items-center ${canResend ? "opacity-100" : "opacity-50"}`}
            onPress={handleResend}
            disabled={!canResend}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <View className="h-8 w-8 items-center justify-center rounded-full border-4 border-gray-200">
                <Text className="text-xs font-black text-gray-700">
                  {canResend ? "✓" : countdown}
                </Text>
              </View>
            </View>
            <Text className="ml-3 text-sm font-black text-gray-400">
              {canResend ? "Resend code" : `Resend in ${countdown}s`}
            </Text>
          </Pressable>

          <Text className="mt-5 max-w-xs text-center text-xs font-semibold leading-5 text-gray-400">
            Did not receive the code? Check your network and try again.
          </Text>
        </View>

        <View className="mt-auto">
          <Pressable
            className={isOtpReady ? vlClassNames.primaryButton : vlClassNames.mutedButton}
            style={isOtpReady ? vlStyles.primaryButtonShadow : undefined}
            onPress={handleVerify}
            disabled={loading}
          >
            <View className="flex-row items-center justify-center gap-2">
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text
                    className={
                      isOtpReady
                        ? vlClassNames.primaryButtonText
                        : vlClassNames.mutedButtonText
                    }
                  >
                    Verify
                  </Text>
                  <NavArrowRight
                    color={isOtpReady ? "#FFFFFF" : "#9CA3AF"}
                    width={18}
                    height={18}
                    strokeWidth={2.5}
                  />
                </>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}


