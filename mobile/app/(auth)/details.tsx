import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthUser, UserRole, useAuthStore } from "@vegelink/shared";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { ProgressStep } from "@/components/common/ProgressStep";
import { NavArrowLeft, NavArrowDown, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const languages = ["EN", "TWI", "HAU", "EWE"] as const;

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firstName, lastName, phone, role } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
  }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [first, setFirst] = useState(firstName?.trim() || "Kofi");
  const [last, setLast] = useState(lastName?.trim() || "Mensah");
  const [region] = useState("Greater Accra");
  const [language, setLanguage] = useState<(typeof languages)[number]>("EN");

  const safeRole: UserRole = role ?? "farmer";
  const safePhone = phone?.trim() || "+233059983273";
  const canCreate = first.trim().length >= 2 && last.trim().length >= 2;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(auth)/verify",
      params: {
        phone: safePhone,
        role: safeRole,
      },
    });
  };

  const handleCreateAccount = () => {
    if (!canCreate) {
      return;
    }

    const user: AuthUser = {
      id: `demo-${safeRole}`,
      phone: safePhone,
      role: safeRole,
      fullName: `${first.trim()} ${last.trim()}`,
    };

    setAuth(user, "demo-token");
    router.replace("/(auth)/success");
  };

  return (
    <View className={vlClassNames.screen} style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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
            </View>
            <Text className="text-xs font-black text-gray-400">Step 3 of 3</Text>
          </View>
        </View>

        <Text className="mt-8 text-4xl font-black leading-tight text-gray-950">
          Your details
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          Almost done - tell us who you are.
        </Text>

        <View className="mt-8 gap-5">
          <Field label="First name" value={first} onChangeText={setFirst} />
          <Field label="Last name" value={last} onChangeText={setLast} />

          <View>
            <Text className="mb-3 text-sm font-black uppercase text-gray-500">
              Region
            </Text>
            <Pressable className={vlClassNames.input}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-black text-gray-950">{region}</Text>
                <NavArrowDown color="#9CA3AF" width={20} height={20} strokeWidth={2} />
              </View>
            </Pressable>
          </View>

          <View>
            <Text className="mb-3 text-sm font-black uppercase text-gray-500">
              Preferred language
            </Text>
            <View className="flex-row gap-2">
              {languages.map((item) => {
                const active = language === item;

                return (
                  <Pressable
                    key={item}
                    className={`h-14 flex-1 items-center justify-center rounded-2xl border-2 ${
                      active ? "bg-green-50" : "bg-white"
                    }`}
                    style={{
                      borderColor: active ? vlColors.brandGreen : vlColors.line,
                    }}
                    onPress={() => setLanguage(item)}
                  >
                    <Text
                      className={`text-sm font-black ${
                        active ? "text-green-800" : "text-gray-500"
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-auto">
          <Pressable
            className={canCreate ? vlClassNames.primaryButton : vlClassNames.mutedButton}
            style={canCreate ? vlStyles.primaryButtonShadow : undefined}
            onPress={handleCreateAccount}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text
                className={
                  canCreate
                    ? vlClassNames.primaryButtonText
                    : vlClassNames.mutedButtonText
                }
              >
                Create Account
              </Text>
              <NavArrowRight
                color={canCreate ? "#FFFFFF" : "#9CA3AF"}
                width={18}
                height={18}
                strokeWidth={2.5}
              />
            </View>
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text className="mb-3 text-sm font-black uppercase text-gray-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#C9CDD5"
        className={vlClassNames.input}
      />
    </View>
  );
}


