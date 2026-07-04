import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { vlColors } from "@/lib/design-system";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ length = 6, value, onChange }: OTPInputProps) {
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

          return (
            <View
              key={index}
              className="h-14 flex-1 items-center justify-center rounded-2xl border-2 bg-green-50"
              style={{ borderColor: vlColors.brandGreen }}
            >
              <Text className="text-2xl font-black text-green-800">
                {digit}
              </Text>
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
        textContentType="oneTimeCode"
      />
    </Pressable>
  );
}
