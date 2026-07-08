import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { ProgressStep } from "@/components/common/ProgressStep";
import { NavArrowLeft, NavArrowDown, NavArrowRight, Check } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "@/components/layout/BottomSheet";

const languages = ["EN", "TWI", "HAU", "EWE"] as const;

const regions = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "Northern",
  "North East",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{
    role?: UserRole;
  }>();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [region, setRegion] = useState("Greater Accra");
  const [isRegionSheetVisible, setIsRegionSheetVisible] = useState(false);
  const [language, setLanguage] = useState<(typeof languages)[number]>("EN");

  const safeRole: UserRole = role ?? "farmer";
  const canContinue = first.trim().length >= 2 && last.trim().length >= 2;

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
      pathname: "/(auth)/phone",
      params: {
        firstName: first.trim(),
        lastName: last.trim(),
        role: safeRole,
        region,
        language,
      },
    });

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
              <ProgressStep />
              <ProgressStep />
              <ProgressStep />
            </View>
            <Text className="text-xs font-black text-gray-400">Step 1 of 4</Text>
          </View>
        </View>

        <Text className="mt-8 text-4xl font-black leading-tight text-gray-950">
          Your details
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          Tell us who you are to get started.
        </Text>

        <View className="mt-8 gap-5">
          <Field label="First name" value={first} onChangeText={setFirst} placeholder="e.g. Kofi" />
          <Field label="Last name" value={last} onChangeText={setLast} placeholder="e.g. Mensah" />

          <View>
            <Text className="mb-3 text-sm font-black uppercase text-gray-500">
              Region
            </Text>
            <Pressable className={vlClassNames.input} onPress={() => setIsRegionSheetVisible(true)}>
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
                Continue
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
      </KeyboardAvoidingView>

      <BottomSheet
        visible={isRegionSheetVisible}
        onClose={() => setIsRegionSheetVisible(false)}
        title="Select Region"
      >
        <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
          <View className="gap-1 py-2">
            {regions.map((item) => {
              const selected = region === item;
              return (
                <Pressable
                  key={item}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 ${
                    selected ? "bg-green-50" : "active:bg-gray-50"
                  }`}
                  onPress={() => {
                    setRegion(item);
                    setIsRegionSheetVisible(false);
                  }}
                >
                  <Text
                    className={`text-base font-bold ${
                      selected ? "text-green-800" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>
                  {selected && (
                    <Check color="#166534" width={20} height={20} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Text className="mb-3 text-sm font-black uppercase text-gray-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C9CDD5"
        className={vlClassNames.input}
      />
    </View>
  );
}
