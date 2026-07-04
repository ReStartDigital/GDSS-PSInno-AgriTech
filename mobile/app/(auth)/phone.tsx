import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { NavArrowLeft, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Path } from "react-native-svg";
import { ProgressStep } from "@/components/common/ProgressStep";

const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  transporter: "Transporter",
  agent: "Agent",
  admin: "Admin",
};

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: UserRole }>();
  const [phone, setPhone] = useState("");
  const safeRole: UserRole = role ?? "farmer";
  const phoneDigits = phone.replace(/\D/g, "").slice(0, 9);
  const canContinue = phoneDigits.length === 9;

  const formatPhoneNumber = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  };

  const displayPlaceholder = useMemo(() => {
    return phoneDigits.length > 0 ? "" : "XX XXX XXXX";
  }, [phoneDigits.length]);

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 9));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(auth)/register");
  };

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    router.push({
      pathname: "/(auth)/verify",
      params: {
        phone: `+233${phoneDigits}`,
        role: safeRole,
      },
    });
  };

  return (
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
              <ProgressStep />
              <ProgressStep />
            </View>
            <Text className="text-xs font-black text-gray-400">Step 1 of 3</Text>
          </View>
        </View>

        <Text className="mt-8 text-4xl font-black leading-tight text-gray-950">
          Your phone number
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          We will send you a verification code
        </Text>

        <View className="mt-8">
          <Text className="text-sm font-black uppercase text-gray-500">
            Mobile number
          </Text>
          <View
            className="mt-3 h-16 flex-row items-center rounded-2xl border-2 bg-white px-4"
            style={{ borderColor: vlColors.brandGreen }}
          >
            <View className="mr-3 h-6 w-9 overflow-hidden rounded-sm border border-gray-100">
              <Svg width={36} height={24} viewBox="0 0 36 24">
                <Rect width={36} height={8} fill="#EF3340" />
                <Rect y={8} width={36} height={8} fill="#FCD116" />
                <Rect y={16} width={36} height={8} fill="#009739" />
                <Path d="M18 9.5l.7 2.2h2.3l-1.9 1.4.7 2.2-1.8-1.3-1.8 1.3.7-2.2-1.9-1.4h2.3z" fill="#000000" />
              </Svg>
            </View>
            <Text className="mr-4 text-xl font-black text-gray-700">+233</Text>
            <View className="mr-4 h-8 w-px bg-gray-200" />
            <TextInput
              value={formatPhoneNumber(phoneDigits)}
              onChangeText={handlePhoneChange}
              placeholder={displayPlaceholder}
              placeholderTextColor="#C9CDD5"
              keyboardType="number-pad"
              maxLength={11}
              className="flex-1 text-xl font-black text-gray-950"
              style={{ paddingVertical: 0, height: "100%" }}
            />
          </View>
          <Text className="mt-2 text-xs font-semibold text-gray-400">
            Standard SMS rates may apply
          </Text>
        </View>

        <View className="mt-7 rounded-2xl border border-green-100 bg-green-50 p-4">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-800">
              <Text className="text-lg font-black text-white">VL</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-sm font-black text-gray-950">
                Registering as {roleLabels[safeRole]}
              </Text>
              <Pressable onPress={handleBack}>
                <Text className="mt-1 text-xs font-black text-gray-500 underline">
                  Change role
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-auto">
          <Pressable
            className={canContinue ? vlClassNames.primaryButton : vlClassNames.mutedButton}
            style={canContinue ? vlStyles.primaryButtonShadow : undefined}
            onPress={handleContinue}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text
                className={
                  canContinue
                    ? vlClassNames.primaryButtonText
                    : vlClassNames.mutedButtonText
                }
              >
                Send Code
              </Text>
              <NavArrowRight
                color={canContinue ? "#FFFFFF" : "#9CA3AF"}
                width={18}
                height={18}
                strokeWidth={2.5}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}


