import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { vlColors } from "@/lib/design-system";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  secure?: boolean;
}

export function OTPInput({ length = 6, value, onChange, secure = false }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (nextValue: string) => {
    onChange(nextValue.replace(/\D/g, "").slice(0, length));
  };

  return (
    <Pressable
      className="relative"
      onPress={() => inputRef.current?.focus()}
    >
      <View className="flex-row justify-between gap-2">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] ?? "";
          const filled = digit !== "";

          return (
            <View
              key={index}
              className="h-14 flex-1 items-center justify-center rounded-2xl border-2 bg-green-50"
              style={{ borderColor: vlColors.brandGreen }}
            >
              {filled && secure ? (
                <View className="h-3 w-3 rounded-full bg-green-800" />
              ) : (
                <Text className="text-2xl font-black text-green-800">
                  {digit}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        className="absolute inset-0 opacity-0"
        keyboardType="number-pad"
        maxLength={length}
        value={value}
        onChangeText={handleChange}
        textContentType={secure ? "password" : "oneTimeCode"}
        secureTextEntry={secure}
      />
    </Pressable>
  );
}
