import { Pressable, Text, View } from "react-native";

const MOMO_PROVIDERS = ["MTN MoMo", "Telecel Cash", "AT Money"] as const;

interface MoMoSelectorProps {
  selected?: string;
  onSelect: (provider: string) => void;
}

export function MoMoSelector({ selected, onSelect }: MoMoSelectorProps) {
  return (
    <View className="gap-2">
      {MOMO_PROVIDERS.map((provider) => (
        <Pressable
          key={provider}
          className={`rounded-lg border px-4 py-3 ${
            selected === provider ? "border-green-800 bg-green-50" : "border-gray-300"
          }`}
          onPress={() => onSelect(provider)}
        >
          <Text className={selected === provider ? "font-semibold text-green-900" : "text-gray-700"}>
            {provider}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
