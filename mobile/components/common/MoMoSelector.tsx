import { Pressable, Text, View } from "react-native";
import { vlColors } from "@/lib/design-system";

const MOMO_PROVIDERS = ["MTN MoMo", "Telecel Cash", "AT Money"] as const;

interface MoMoSelectorProps {
  selected?: string;
  onSelect: (provider: string) => void;
}

export function MoMoSelector({ selected, onSelect }: MoMoSelectorProps) {
  return (
    <View className="gap-3">
      {MOMO_PROVIDERS.map((provider) => {
        const isActive = selected === provider;

        return (
          <Pressable
            key={provider}
            className={`rounded-2xl border-2 px-4 py-4 active:opacity-80 ${
              isActive ? "bg-green-50" : "bg-white"
            }`}
            style={{
              borderColor: isActive ? vlColors.brandGreen : vlColors.line,
            }}
            onPress={() => onSelect(provider)}
          >
            <Text
              className={`text-base font-black ${
                isActive ? "text-green-800" : "text-gray-700"
              }`}
            >
              {provider}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
