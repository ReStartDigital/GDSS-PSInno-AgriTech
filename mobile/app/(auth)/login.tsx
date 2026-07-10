import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavArrowRight, Phone } from "iconoir-react-native";
import { OTPInput } from "@/components/common/OTPInput";
import { useAuthStore } from "@vegelink/shared";
import { apiClient } from "@/lib/api-client";
import { vlClassNames, vlStyles } from "@/lib/design-system";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [phoneVal, setPhoneVal] = useState("");
  const [pinVal, setPinVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phoneVal.trim() || !pinVal.trim()) {
      setError("Please fill in both phone and PIN.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Auto-format phone to E.164 if not already prefixed
      const rawPhone = phoneVal.trim();
      const formattedPhone = rawPhone.startsWith("+") 
        ? rawPhone 
        : `+233${rawPhone.replace(/^0/, "")}`;

      const res = await apiClient.post("/auth/login", {
        phone: formattedPhone,
        pin: pinVal.trim(),
      }) as any;

      const { user, accessToken, refreshToken } = res.data;

      // Persist opaque refresh token
      await SecureStore.setItemAsync("vegelink_refresh_token", refreshToken);

      // Save user session in global store
      setAuth(
        {
          id: user.id,
          phone: user.phone,
          role: user.role,
          fullName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ").trim(),
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          email: user.email,
        },
        accessToken
      );

      // Redirect directly to home dashboard
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.error?.message || "Invalid phone number or PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = phoneVal.trim().length >= 8 && pinVal.trim().length === 4;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 16, 48),
          paddingBottom: Math.max(insets.bottom + 16, 32),
          paddingHorizontal: 24,
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <View className="flex-1 justify-center pt-8 pb-12">
          {/* Logo Brand Header */}
          <View className="flex-row items-center gap-3 mb-10">
            <Image
              source={require("@/assets/images/vegelink-Photoroom.png")}
              className="h-9 w-9"
              resizeMode="contain"
            />
            <Text className="text-lg font-black text-green-800">VegeLink</Text>
          </View>

          {/* Intro Headers */}
          <Text className="text-4xl font-black leading-tight text-gray-950">
            Welcome Back
          </Text>
          <Text className="mt-3 text-base leading-6 text-gray-500">
            Log in to your account with your registered phone number and PIN passcode.
          </Text>

          {/* Form Fields */}
          <View className="mt-8 gap-4">
            {/* Phone input wrapper */}
            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                Phone Number
              </Text>
              <View className="h-16 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <Phone color="#9CA3AF" width={20} height={20} className="mr-3" />
                <TextInput
                  value={phoneVal}
                  onChangeText={(val) => {
                    setPhoneVal(val);
                    setError("");
                  }}
                  placeholder="e.g. 024 123 4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 text-xl font-extrabold text-gray-950 p-0"
                />
              </View>
            </View>

            {/* PIN passcode input */}
            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">
                PIN Passcode
              </Text>
              <OTPInput
                length={4}
                value={pinVal}
                onChange={(val) => {
                  setPinVal(val);
                  setError("");
                }}
                secure
              />
            </View>
          </View>

          {/* Error Banner */}
          {error ? (
            <View className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-150">
              <Text className="text-sm font-bold text-red-600 text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <View className="mt-8">
            <Pressable
              disabled={!isFormValid || loading}
              onPress={handleLogin}
              className={`h-16 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-95 ${
                isFormValid && !loading ? "bg-green-800 shadow-md shadow-green-900/10" : "bg-[#C0D5C7]"
              }`}
              style={isFormValid && !loading ? vlStyles.primaryButtonShadow : undefined}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text className={vlClassNames.primaryButtonText}>Log In</Text>
                  <NavArrowRight color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Footer Redirect Options */}
        <View className="items-center mt-auto pt-6 border-t border-gray-100">
          <Text className="text-sm font-semibold text-gray-400">
            {"New to VegeLink? "}
            <Text
              onPress={() => router.push("/(auth)/register")}
              className="font-black text-green-800 underline"
            >
              Create Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
