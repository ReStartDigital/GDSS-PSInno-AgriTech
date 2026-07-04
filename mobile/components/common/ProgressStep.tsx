import { View } from "react-native";

export function ProgressStep({ active = false }: { active?: boolean }) {
  return (
    <View
      className={`h-1.5 flex-1 rounded-full ${
        active ? "bg-green-800" : "bg-gray-100"
      }`}
    />
  );
}
