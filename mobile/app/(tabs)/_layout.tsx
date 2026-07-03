import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "@vegelink/shared";
import { vlColors } from "@/lib/design-system";

const tabIcons: Record<string, string> = {
  home: "⌂",
  marketplace: "▦",
  listings: "▤",
  jobs: "▣",
  orders: "▣",
  profile: "⌾",
};

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: vlColors.brandGreen,
        tabBarInactiveTintColor: vlColors.textMuted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
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
        tabBarIcon: ({ color, focused }) => (
          <View
            className={`h-10 w-10 items-center justify-center rounded-full ${
              focused ? "bg-green-50" : "bg-transparent"
            }`}
          >
            <Text style={{ color, fontSize: 22, fontWeight: "900" }}>
              {tabIcons[route.name] ?? "•"}
            </Text>
          </View>
        ),
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
