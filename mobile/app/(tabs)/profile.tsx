import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserRole, useAuthStore } from "@vegelink/shared";
import {
  User,
  Bell,
  Heart,
  Language,
  Phone,
  LogOut,
  NavArrowRight,
  Star,
} from "iconoir-react-native";

const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer Account",
  buyer: "Buyer Account",
  transporter: "Transporter Account",
  agent: "Agent Account",
  admin: "Admin Account",
};

const menuItems = [
  { label: "Edit Profile", icon: User, tone: "green" },
  { label: "Notifications", icon: Bell, tone: "amber" },
  { label: "Saved Produce", icon: Heart, tone: "red" },
  { label: "Language: English", icon: Language, tone: "blue" },
  { label: "Help & Support", icon: Phone, tone: "purple" },
] as const;

const toneStyles = {
  green: { bg: "#EEF8F0", text: "#177A33" },
  amber: { bg: "#FFF7ED", text: "#F59E0B" },
  red: { bg: "#FEF2F2", text: "#EF4444" },
  blue: { bg: "#EEF2FF", text: "#2563EB" },
  purple: { bg: "#F5F3FF", text: "#7C3AED" },
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const fullName = user?.fullName ?? "Kofi Mensah";
  const role = user?.role ?? "buyer";

  const handleLogout = () => {
    clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 112,
        }}
      >
        <View className="bg-white px-5 pb-8" style={{ paddingTop: Math.max(insets.top + 16, 32) }}>
          <Text className="text-3xl font-black text-gray-950">Profile</Text>

          <View className="mt-7 flex-row items-center">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-green-800 shadow-sm">
              <Text className="text-2xl font-black text-white">{initials(fullName)}</Text>
            </View>
            <View className="ml-5 flex-1">
              <Text className="text-xl font-black text-gray-950">{fullName}</Text>
              <Text className="mt-2 text-sm font-semibold text-gray-500">
                Greater Accra Region
              </Text>
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <StatTile value="0" label="Orders" />
            <StatTile value="0" label="Saved" />
            <View className="h-16 flex-1 items-center justify-center rounded-2xl bg-green-50">
              <View className="flex-row items-center gap-1">
                <Star color="#F59E0B" fill="#F59E0B" width={16} height={16} strokeWidth={2} />
                <Text className="text-xl font-black text-green-800">4.8</Text>
              </View>
              <Text className="mt-1 text-xs font-semibold text-gray-500">Rating</Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-4">
          <View className="gap-3">
            {menuItems.map((item) => (
              <ProfileRow
                key={item.label}
                label={item.label}
                icon={item.icon}
                tone={item.tone}
              />
            ))}

            <Pressable
              className="min-h-[72px] flex-row items-center rounded-2xl bg-red-50 px-4 py-4 active:opacity-80"
              onPress={handleLogout}
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
                <LogOut color="#EF4444" width={22} height={22} strokeWidth={2} />
              </View>
              <Text className="ml-4 flex-1 text-base font-black text-red-600">
                Sign Out
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View className="h-16 flex-1 items-center justify-center rounded-2xl bg-green-50">
      <Text className="text-xl font-black text-green-800">{value}</Text>
      <Text className="mt-1 text-xs font-semibold text-gray-500">{label}</Text>
    </View>
  );
}

function ProfileRow({
  label,
  icon: IconComponent,
  tone,
}: {
  label: string;
  icon: React.ComponentType<{ color: string; width: number; height: number; strokeWidth: number }>;
  tone: keyof typeof toneStyles;
}) {
  const colors = toneStyles[tone];

  return (
    <Pressable className="min-h-[72px] flex-row items-center rounded-2xl bg-white px-4 py-4 shadow-sm active:bg-gray-50">
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: colors.bg }}
      >
        <IconComponent color={colors.text} width={20} height={20} strokeWidth={2} />
      </View>
      <Text className="ml-4 flex-1 text-base font-black text-gray-950">{label}</Text>
      <NavArrowRight color="#D1D5DB" width={24} height={24} strokeWidth={2.5} />
    </Pressable>
  );
}

function initials(value: string) {
  return value
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
