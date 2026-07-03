import { TextInput, View } from "react-native";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ length = 6, value, onChange }: OTPInputProps) {
  return (
    <View className="flex-row justify-center gap-2">
      <TextInput
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest"
        keyboardType="number-pad"
        maxLength={length}
        value={value}
        onChangeText={onChange}
        placeholder={"0".repeat(length)}
      />
    </View>
  );
}
