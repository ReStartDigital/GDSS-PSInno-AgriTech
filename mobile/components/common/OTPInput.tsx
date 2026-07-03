import { TextInput, View } from "react-native";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ length = 6, value, onChange }: OTPInputProps) {
  const handleChange = (nextValue: string) => {
    onChange(nextValue.replace(/\D/g, "").slice(0, length));
  };

  return (
    <View className="flex-row justify-center gap-2">
      <TextInput
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-bold text-gray-950"
        keyboardType="number-pad"
        maxLength={length}
        value={value}
        onChangeText={handleChange}
        placeholder={"0".repeat(length)}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}
