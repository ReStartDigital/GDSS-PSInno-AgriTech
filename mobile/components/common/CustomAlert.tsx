import React from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { CheckCircle, InfoCircle, WarningCircle } from "iconoir-react-native";
import { useAlertStore, AlertButton } from "@/lib/alert-service";

export function CustomAlert() {
  const {
    visible,
    title,
    message,
    buttons,
    isPrompt,
    promptPlaceholder,
    promptValue,
    type,
    setPromptValue,
    hideAlert,
  } = useAlertStore();

  if (!visible) return null;

  // Icon selector based on type
  const renderIcon = () => {
    switch (type) {
      case "success":
        return (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
            <CheckCircle color="#16A34A" width={40} height={40} strokeWidth={2} />
          </View>
        );
      case "warning":
        return (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-4">
            <WarningCircle color="#D97706" width={40} height={40} strokeWidth={2} />
          </View>
        );
      case "error":
        return (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
            <InfoCircle color="#DC2626" width={40} height={40} strokeWidth={2} />
          </View>
        );
      case "info":
      default:
        return (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
            <InfoCircle color="#2563EB" width={40} height={40} strokeWidth={2} />
          </View>
        );
    }
  };

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    // Execute onPress handler with prompt value if it's a prompt, otherwise regular execution
    if (btn.onPress) {
      if (isPrompt) {
        btn.onPress(promptValue);
      } else {
        btn.onPress();
      }
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay} className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-[340px] items-center rounded-3xl bg-white p-6 shadow-2xl">
          {renderIcon()}

          <Text className="text-center text-xl font-black text-gray-950 leading-6">
            {title}
          </Text>

          {message ? (
            <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
              {message}
            </Text>
          ) : null}

          {isPrompt ? (
            <TextInput
              className="mt-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-base font-semibold text-gray-900"
              placeholder={promptPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={promptValue}
              onChangeText={setPromptValue}
              autoFocus
            />
          ) : null}

          {/* Action Buttons */}
          <View className="mt-6 w-full gap-3">
            {buttons.map((btn, index) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              let btnBg = "bg-green-800";
              let btnText = "text-white";

              if (isCancel) {
                btnBg = "bg-gray-100";
                btnText = "text-gray-600";
              } else if (isDestructive) {
                btnBg = "bg-red-50 border border-red-200";
                btnText = "text-red-600";
              }

              return (
                <Pressable
                  key={index}
                  className={`w-full rounded-2xl py-3.5 items-center justify-center active:opacity-85 ${btnBg}`}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text className={`text-base font-black ${btnText}`}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
