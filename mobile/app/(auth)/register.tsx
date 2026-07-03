import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { vlClassNames } from "@/lib/design-system";

type RoleOption = {
  id: Extract<UserRole, "farmer" | "buyer" | "transporter">;
  label: string;
  localLabel: string;
  description: string;
  icon: string;
};

const roles: RoleOption[] = [
  {
    id: "farmer",
    label: "Farmer",
    localLabel: "Okuafo",
    description: "I grow and sell vegetables",
    icon: "Y",
  },
  {
    id: "buyer",
    label: "Buyer",
    localLabel: "Otoni",
    description: "I buy fresh produce",
    icon: "B",
  },
  {
    id: "transporter",
    label: "Transporter",
    localLabel: "Okwantufo",
    description: "I deliver produce",
    icon: "T",
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption["id"]>("farmer");

  const handleContinue = () => {
    router.push({
      pathname: "/(auth)/phone",
      params: { role },
    });
  };

  return (
    <View className={vlClassNames.screen}>
      <View className="flex-1 px-6 pb-10 pt-14">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-green-50">
            <View className="h-5 w-5 items-center justify-center rounded-full bg-green-800">
              <Text className="text-[10px] font-black text-white">VL</Text>
            </View>
          </View>
          <Text className="text-lg font-black text-green-800">VegeLink</Text>
        </View>

        <Text className="mt-10 text-4xl font-black leading-tight text-gray-950">
          Who are you?
        </Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          Choose your role to get started
        </Text>

        <View className="mt-7 gap-4">
          {roles.map((item) => (
            <RoleCard
              key={item.id}
              option={item}
              selected={role === item.id}
              onPress={() => setRole(item.id)}
            />
          ))}
        </View>

        <View className="mt-auto">
          <Pressable className={vlClassNames.primaryButton} onPress={handleContinue}>
            <Text className={vlClassNames.primaryButtonText}>Continue  -&gt;</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RoleCard({
  option,
  selected,
  onPress,
}: {
  option: RoleOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`min-h-28 rounded-2xl border-2 p-5 active:opacity-80 ${
        selected ? "border-green-800 bg-green-50" : "border-gray-100 bg-white"
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${
            selected ? "bg-green-800" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-2xl font-black ${
              selected ? "text-white" : "text-gray-400"
            }`}
          >
            {option.icon}
          </Text>
        </View>

        <View className="ml-4 flex-1">
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="text-xl font-black text-gray-950">{option.label}</Text>
            <Text className="text-xs font-black text-gray-400">
              {option.localLabel}
            </Text>
          </View>
          <Text className="mt-1 text-sm font-black text-gray-500">
            {option.description}
          </Text>
        </View>

        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${
            selected ? "bg-green-800" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-base font-black ${
              selected ? "text-white" : "text-gray-300"
            }`}
          >
            {selected ? "✓" : ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
