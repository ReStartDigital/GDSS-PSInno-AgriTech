import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRole, useAuthStore } from "@vegelink/shared";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { Check, NavArrowRight } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  transporter: "Transporter",
  agent: "Agent",
  admin: "Admin",
};

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")[0] || "Kofi";
  const fullName = user?.fullName || "Kofi Mensah";
  const role = user?.role ?? "farmer";

  return (
    <View className={vlClassNames.screen} style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-6 pb-10 pt-10">
        <View className="items-center">
          <View className="h-52 w-52 items-center justify-center rounded-full bg-gray-50">
            <View className="h-36 w-36 items-center justify-center rounded-full bg-green-50">
              <View className="h-28 w-28 items-center justify-center rounded-full bg-green-800">
                <Check color="#FFFFFF" width={56} height={56} strokeWidth={3} />
              </View>
            </View>
            <Dot className="left-12 top-12 bg-yellow-500" />
            <Dot className="right-12 top-10 bg-red-500" />
            <Dot className="bottom-16 left-10 bg-green-400" />
            <Dot className="bottom-10 left-24 bg-red-500" />
            <Dot className="bottom-14 right-12 bg-blue-600" />
            <Dot className="bottom-7 right-20 bg-yellow-500" />
            <Dot className="left-24 top-5 bg-green-600" />
          </View>

          <Text className="mt-4 text-center text-4xl font-black leading-tight text-gray-950">
            Welcome, {firstName}!
          </Text>
          <Text className="mt-5 max-w-xs text-center text-base leading-7 text-gray-600">
            Your VegeLink account is ready. Let{'\''} start trading.
          </Text>
        </View>

        <View className="mt-9 rounded-2xl border border-green-100 bg-green-50 p-5">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-800">
              <Text className="text-lg font-black text-white">VL</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-green-900">
                {roleLabels[role]}
              </Text>
              <Text className="mt-1 text-sm font-black text-gray-950">{fullName}</Text>
              <Text className="mt-1 text-xs font-semibold text-gray-500">
                Greater Accra Region
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-green-800">
              <Check color="#FFFFFF" width={22} height={22} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        <View className="mt-9 flex-row justify-center gap-8">
          <Stat value="12K+" label="Farmers" />
          <Stat value="8K+" label="Buyers" />
          <Stat value="2K+" label="Drivers" />
        </View>

        <View className="mt-auto">
          <Pressable
            className={vlClassNames.primaryButton}
            style={vlStyles.primaryButtonShadow}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className={vlClassNames.primaryButtonText}>
                Go to Dashboard
              </Text>
              <NavArrowRight color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
            </View>
          </Pressable>
          <Text className="mt-5 text-center text-xs font-semibold text-gray-400">
            VegeLink Ghana - Agro Marketplace & Transport Network
          </Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-2xl font-black text-green-800">{value}</Text>
      <Text className="mt-1 text-xs font-semibold text-gray-500">{label}</Text>
    </View>
  );
}

function Dot({ className }: { className: string }) {
  return (
    <View
      className={`absolute h-3 w-3 rounded-full ${className}`}
      style={{ shadowColor: vlColors.textInk, shadowOpacity: 0.04 }}
    />
  );
}
