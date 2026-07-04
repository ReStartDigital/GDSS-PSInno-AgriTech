import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@vegelink/shared";
import { vlColors } from "@/lib/design-system";
import {
  Home,
  Shop,
  List,
  Truck,
  BoxIso,
  User,
} from "iconoir-react-native";

const tabIconMap: Record<string, React.ComponentType<{ color: string; width: number; height: number; strokeWidth: number }>> = {
  home: Home,
  marketplace: Shop,
  listings: List,
  jobs: Truck,
  orders: BoxIso,
  profile: User,
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: vlColors.brandGreen,
        tabBarInactiveTintColor: vlColors.textMuted,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopColor: "#F0F2F4",
          backgroundColor: "#FFFFFF",
          shadowColor: "#111827",
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "900",
        },
        tabBarIcon: ({ color, focused }) => {
          const IconComponent = tabIconMap[route.name];

          return (
            <View
              className={`h-10 w-10 items-center justify-center rounded-full ${
                focused ? "bg-green-50" : "bg-transparent"
              }`}
            >
              {IconComponent ? (
                <IconComponent color={color as string} width={22} height={22} strokeWidth={2} />
              ) : null}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Browse",
          href: role === "buyer" ? "/(tabs)/marketplace" : null,
        }}
      />

      <Tabs.Screen
        name="listings"
        options={{
          title: "My Listings",
          href: role === "farmer" ? "/(tabs)/listings" : null,
        }}
      />

      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          href: role === "transporter" ? "/(tabs)/jobs" : null,
        }}
      />

      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
