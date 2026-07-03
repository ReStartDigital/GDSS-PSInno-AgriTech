import { Tabs } from "expo-router";
import { useAuthStore } from "@shared/stores/auth.store";

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
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
