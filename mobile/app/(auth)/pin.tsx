import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthUser, UserRole, useAuthStore } from "@vegelink/shared";
import { vlClassNames, vlStyles } from "@/lib/design-system";
import { ProgressStep } from "@/components/common/ProgressStep";
import { NavArrowLeft, NavArrowRight, Lock } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "@/lib/api-client";

const PIN_LENGTH = 4;

export default function PinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { firstName, lastName, phone, role, region, language, registrationToken } = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    region?: string;
    language?: string;
    registrationToken?: string;
  }>();

  const safeRole: UserRole = role ?? "farmer";
  const safePhone = phone?.trim() || "+233059983273";
  const safeFirst = firstName?.trim() || "Kofi";
  const safeLast = lastName?.trim() || "Mensah";

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);

  const pinRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setPin(digits);
    setPinError("");
    if (digits.length === PIN_LENGTH) {
      confirmRef.current?.focus();
    }
  };

  const handleConfirmChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setConfirmPin(digits);
    setPinError("");
  };

  const isPinValid = pin.length === PIN_LENGTH;
  const isConfirmValid = confirmPin.length === PIN_LENGTH;
  const canCreate = isPinValid && isConfirmValid && !loading;

  const handleCreateAccount = async () => {
    if (!canCreate) return;

    if (pin !== confirmPin) {
      setPinError("PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    setLoading(true);
    setPinError("");
    try {
      if (!registrationToken) {
        throw new Error("Missing registration verification handshake token. Please verify OTP first.");
      }

      // Complete PIN setup
      const res = await apiClient.post("/auth/set-pin", { pin }, {
        headers: {
          Authorization: `Bearer ${registrationToken}`
        }
      }) as any;

      const { user, accessToken, refreshToken } = res.data;

      // Save refresh token
      await SecureStore.setItemAsync("vegelink_refresh_token", refreshToken);

      // Save credentials in memory store
      const mappedUser: AuthUser = {
        id: user.id,
        phone: user.phone,
        role: user.role as UserRole,
        fullName: `${user.firstName || safeFirst} ${user.lastName || safeLast}`.trim(),
        firstName: user.firstName || safeFirst,
        lastName: user.lastName || safeLast,
        email: user.email,
      };
      setAuth(mappedUser, accessToken);

      // Post-onboarding update profile (region & preferred language)
      if (region || language) {
        try {
          await apiClient.patch("/users/me", {
            firstName: safeFirst,
            lastName: safeLast,
            region: region || undefined,
            language: language || undefined,
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
        } catch (profileErr) {
          console.warn("Failed to set onboarding region/language", profileErr);
        }
      }

      router.replace("/(auth)/success");
    } catch (err: any) {
      const errMsg = err.error?.message || "Could not set security PIN. Please try again.";
      setPinError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(auth)/details",
      params: {
        firstName: safeFirst,
        lastName: safeLast,
        phone: safePhone,
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
        {/* Header with progress */}
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
              <ProgressStep active />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-black text-gray-400">Step 4 of 4</Text>
              <Text className="text-xs font-black text-gray-400">Security Setup</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text className="mt-8 text-4xl font-black leading-tight text-gray-950">
          Create your{"\n"}Security PIN
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          This PIN will be used to authorize transactions and secure your account.
        </Text>

        {/* Info card */}
        <View className="mt-7 flex-row items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-green-800">
            <Lock color="white" width={22} height={22} strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-black text-gray-950">
              Choose a 4–6 digit PIN
            </Text>
            <Text className="mt-0.5 text-xs font-semibold text-gray-500">
              Keep this PIN private and secure.
            </Text>
          </View>
        </View>

        {/* New PIN */}
        <View className="mt-8">
          <Text className="mb-3 text-sm font-black uppercase text-gray-500">
            New PIN
          </Text>
          <PinBoxes
            value={pin}
            inputRef={pinRef}
            onChange={handlePinChange}
            autoFocus
          />
        </View>

        {/* Confirm PIN */}
        <View className="mt-6">
          <Text className="mb-3 text-sm font-black uppercase text-gray-500">
            Confirm PIN
          </Text>
          <PinBoxes
            value={confirmPin}
            inputRef={confirmRef}
            onChange={handleConfirmChange}
          />
        </View>

        {/* Error message */}
        {pinError ? (
          <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
            <Text className="text-sm font-black text-red-600">{pinError}</Text>
          </View>
        ) : null}

        {/* Submit button */}
        <View className="mt-auto">
          <Pressable
            className={canCreate ? vlClassNames.primaryButton : vlClassNames.mutedButton}
            style={canCreate ? vlStyles.primaryButtonShadow : undefined}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            <View className="flex-row items-center justify-center gap-2">
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text
                    className={
                      canCreate
                        ? vlClassNames.primaryButtonText
                        : vlClassNames.mutedButtonText
                    }
                  >
                    Create account
                  </Text>
                  <NavArrowRight
                    color={canCreate ? "#FFFFFF" : "#9CA3AF"}
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

function PinBoxes({
  value,
  inputRef,
  onChange,
  autoFocus = false,
}: {
  value: string;
  inputRef: React.RefObject<TextInput | null>;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <Pressable className="relative" onPress={() => inputRef.current?.focus()}>
      <View className="flex-row gap-2">
        {Array.from({ length: PIN_LENGTH }).map((_, index) => {
          const filled = index < value.length;

          return (
            <View
              key={index}
              className={`h-14 flex-1 items-center justify-center rounded-2xl border-2 ${
                filled ? "border-green-800 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              {filled ? (
                <View className="h-3 w-3 rounded-full bg-green-800" />
              ) : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        className="absolute inset-0 opacity-0"
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        value={value}
        onChangeText={onChange}
        secureTextEntry
        autoFocus={autoFocus}
      />
    </Pressable>
  );
}
