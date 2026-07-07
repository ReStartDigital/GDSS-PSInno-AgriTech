import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavArrowRight } from "iconoir-react-native";


type OnboardingSlide = {
  role: "farmer" | "buyer" | "transporter";
  eyebrow: string;
  title: string;
  body: string;
  tint: string;
};

const slides: OnboardingSlide[] = [
  {
    role: "farmer",
    eyebrow: "For farmers",
    title: "Sell Your Harvest",
    body: "Connect directly with buyers across Ghana. Get fair prices without middlemen.",
    tint: "#E7F6E9",
  },
  {
    role: "buyer",
    eyebrow: "For buyers",
    title: "Fresh Produce Daily",
    body: "Order straight from farms near you. Delivered to your market stall or door.",
    tint: "#FFF6DA",
  },
  {
    role: "transporter",
    eyebrow: "For transporters",
    title: "Drive & Earn",
    body: "Join our transport network. Carry produce on your route and grow your income.",
    tint: "#E4F3FF",
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;

  const continueFlow = () => {
    if (isLastSlide) {
      router.push("/(auth)/register");
      return;
    }

    setActiveIndex((index) => index + 1);
  };

  return (
    <View
      className={`${vlClassNames.screen} ${vlClassNames.pagePadding} pb-10`}
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-green-800">
            <Text className="text-xs font-black text-white">VL</Text>
          </View>
          <Text className="text-lg font-black text-green-800">VegeLink</Text>
        </View>

        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text className="font-bold text-gray-400">Skip</Text>
        </Pressable>
      </View>

      <View className="flex-1 justify-center">
        <View
          className="mx-auto h-56 w-full max-w-80 overflow-hidden rounded-3xl"
          style={{ backgroundColor: slide.tint }}
        >
          <SlideIllustration role={slide.role} />
        </View>

        <Text className="mt-8 text-center text-xs font-black uppercase text-amber-500">
          {slide.eyebrow}
        </Text>
        <Text className="mt-3 text-center text-3xl font-black text-gray-950">
          {slide.title}
        </Text>
        <Text className="mt-4 text-center text-base leading-6 text-gray-600">
          {slide.body}
        </Text>
      </View>

      <View className="mb-6 flex-row justify-center gap-2">
        {slides.map((item, index) => (
          <View
            key={item.role}
            className={`h-2.5 rounded-full ${
              index === activeIndex ? "w-8 bg-green-800" : "w-2.5 bg-gray-200"
            }`}
          />
        ))}
      </View>

      <Pressable
        className={vlClassNames.primaryButton}
        style={vlStyles.primaryButtonShadow}
        onPress={continueFlow}
      >
        <View className="flex-row items-center justify-center gap-2">
          <Text className={vlClassNames.primaryButtonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
          <NavArrowRight color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
        </View>
      </Pressable>
    </View>
  );
}

function SlideIllustration({ role }: { role: OnboardingSlide["role"] }) {
  if (role === "buyer") {
    return (
      <View className="flex-1 justify-end p-6">
        <View className="h-24 rounded-t-3xl bg-amber-400" />
        <View className="h-4 bg-amber-800" />
        <View className="flex-row justify-around bg-amber-900 px-4 py-3">
          {["#EF4444", "#22C55E", "#F59E0B"].map((color) => (
            <View key={color} className="h-8 w-8 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </View>
        <View className="absolute bottom-4 right-12 h-10 w-10 rounded-full bg-amber-700" />
        <View className="absolute bottom-2 right-8 h-8 w-8 rounded-md bg-purple-500" />
        <View className="absolute bottom-2 right-2 h-8 w-8 rounded-md bg-amber-500" />
      </View>
    );
  }

  if (role === "transporter") {
    return (
      <View className="flex-1 justify-end">
        <View className="mx-6 mb-10 h-16 rounded-lg bg-blue-600">
          <View className="absolute -right-8 top-2 h-12 w-20 rounded-lg bg-blue-500" />
          <View className="absolute left-4 top-3 flex-row gap-2">
            {["#EF4444", "#22C55E", "#F59E0B", "#DC2626", "#10B981"].map((color) => (
              <View key={color} className="h-7 w-7 rounded-full" style={{ backgroundColor: color }} />
            ))}
          </View>
          <View className="absolute -bottom-5 left-10 h-12 w-12 rounded-full bg-gray-800" />
          <View className="absolute -bottom-5 right-12 h-12 w-12 rounded-full bg-gray-800" />
        </View>
        <View className="h-14 bg-slate-700" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-end">
      <View className="absolute right-10 top-6 h-16 w-16 rounded-full bg-yellow-300" />
      <View className="h-20 bg-green-200" />
      <View className="h-14 bg-green-300" />
      <View className="h-12 bg-green-200" />
      <View className="absolute bottom-16 left-1/2 h-24 w-10 -translate-x-5 rounded-t-full bg-amber-800" />
      <View
        className="absolute bottom-8 left-1/2 h-20 w-16 -translate-x-8 rounded-lg"
        style={{ backgroundColor: vlColors.brandGreenDark }}
      />
      <View className="absolute bottom-4 left-1/2 h-10 w-4 -translate-x-5 rounded-full bg-blue-600" />
      <View className="absolute bottom-4 left-1/2 h-10 w-4 translate-x-1 rounded-full bg-blue-500" />
      <View className="absolute bottom-24 left-28 h-3 w-12 -rotate-12 rounded-full bg-amber-800" />
      <View className="absolute bottom-28 right-24 h-12 w-14 rounded-lg bg-amber-800" />
      {["#EF4444", "#22C55E", "#F59E0B"].map((color, index) => (
        <View
          key={color}
          className="absolute h-4 w-4 rounded-full"
          style={{
            backgroundColor: color,
            bottom: 158,
            right: 88 - index * 14,
          }}
        />
      ))}
    </View>
  );
}
