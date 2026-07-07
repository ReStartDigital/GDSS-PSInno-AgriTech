import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";
import { vlClassNames, vlStyles } from "@/lib/design-system";
import { Farm, Shop, Truck, User, Check, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RoleColors = {
  border: string;
  bg: string;
  iconBg: string;
};

type RoleOption = {
  id: Extract<UserRole, "farmer" | "buyer" | "transporter" | "agent">;
  label: string;
  localLabel: string;
  description: string;
  Icon: React.ComponentType<{ color: string; width: number; height: number; strokeWidth: number }>;
  colors: RoleColors;
};

const roles: RoleOption[] = [
  {
    id: "farmer",
    label: "Farmer",
    localLabel: "Okuafo",
    description: "I grow and sell vegetables",
    Icon: Farm,
    colors: { border: "#166534", bg: "#F0FDF4", iconBg: "#166534" },
  },
  {
    id: "buyer",
    label: "Buyer",
    localLabel: "Otoni",
    description: "I buy fresh produce",
    Icon: Shop,
    colors: { border: "#B45309", bg: "#FFFBEB", iconBg: "#B45309" },
  },
  {
    id: "transporter",
    label: "Transporter",
    localLabel: "Okwantufo",
    description: "I deliver produce",
    Icon: Truck,
    colors: { border: "#1D4ED8", bg: "#EFF6FF", iconBg: "#1D4ED8" },
  },
  {
    id: "agent",
    label: "Agent",
    localLabel: "Nnanibea",
    description: "I represent farmers",
    Icon: User,
    colors: { border: "#7C3AED", bg: "#F5F3FF", iconBg: "#7C3AED" },
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<RoleOption["id"]>("farmer");

  const handleContinue = () => {
    router.push({
      pathname: "/(auth)/details",
      params: { role },
    });
  };

  return (
    <View className={vlClassNames.screen} style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-6 pb-10 pt-4">
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
          <Pressable
            className={vlClassNames.primaryButton}
            style={vlStyles.primaryButtonShadow}
            onPress={handleContinue}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className={vlClassNames.primaryButtonText}>Continue</Text>
              <NavArrowRight color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
            </View>
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
        selected ? "" : "border-gray-100 bg-white"
      }`}
      style={selected ? { borderColor: option.colors.border, backgroundColor: option.colors.bg } : undefined}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${
            selected ? "" : "bg-gray-100"
          }`}
          style={selected ? { backgroundColor: option.colors.iconBg } : undefined}
        >
          <option.Icon
            color={selected ? "#FFFFFF" : "#9CA3AF"}
            width={32}
            height={32}
            strokeWidth={1.8}
          />
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
            selected ? "" : "bg-gray-100"
          }`}
          style={selected ? { backgroundColor: option.colors.iconBg } : undefined}
        >
          {selected ? (
            <Check color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
