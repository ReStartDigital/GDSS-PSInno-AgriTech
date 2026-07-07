import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ChatBubble } from "iconoir-react-native";

export default function OrderMessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Messages" subtitle={`Chat for Order #${id}`} />

      <View className="flex-1 items-center px-8 pt-20">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
          <ChatBubble color="#166534" width={44} height={44} strokeWidth={1.5} />
        </View>

        <Text className="mt-6 text-center text-xl font-black text-gray-950">
          No messages yet
        </Text>
        <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
          Start a conversation with the coordinator, farmer, or transporter for Order #{id}.
        </Text>
      </View>
    </View>
  );
}
