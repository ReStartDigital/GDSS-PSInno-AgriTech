import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { vlClassNames, vlColors } from "@/lib/design-system";

const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  transporter: "Transporter",
  agent: "Agent",
  admin: "Admin",
};

export default function PhoneScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: UserRole }>();
  const [phone, setPhone] = useState("");
  const safeRole: UserRole = role ?? "farmer";
  const phoneDigits = phone.replace(/\D/g, "").slice(0, 9);
  const canContinue = phoneDigits.length === 9;

  const displayPlaceholder = useMemo(() => {
    return phoneDigits.length > 0 ? "" : "XX XXX XXXX";
  }, [phoneDigits.length]);

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 9));
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
    <View className={vlClassNames.screen}>
      <View className="flex-1 px-6 pb-10 pt-9">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Go back"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200"
            onPress={() => router.back()}
          >
            <Text className="text-3xl font-black text-gray-950">‹</Text>
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
            className="mt-3 min-h-16 flex-row items-center rounded-2xl border-2 bg-white px-4"
            style={{ borderColor: vlColors.brandGreen }}
          >
            <View className="mr-3 h-7 w-9 overflow-hidden rounded-sm">
              <View className="h-1/3 bg-red-600" />
              <View className="h-1/3 bg-yellow-400" />
              <View className="h-1/3 bg-green-700" />
            </View>
            <Text className="mr-4 text-xl font-black text-gray-700">+233</Text>
            <View className="mr-4 h-8 w-px bg-gray-200" />
            <TextInput
              value={phoneDigits}
              onChangeText={handlePhoneChange}
              placeholder={displayPlaceholder}
              placeholderTextColor="#C9CDD5"
              keyboardType="number-pad"
              maxLength={9}
              className="flex-1 text-xl font-black tracking-widest text-gray-950"
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
              <Pressable onPress={() => router.back()}>
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
            onPress={handleContinue}
          >
            <Text
              className={
                canContinue
                  ? vlClassNames.primaryButtonText
                  : vlClassNames.mutedButtonText
              }
            >
              Send Code  -&gt;
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
