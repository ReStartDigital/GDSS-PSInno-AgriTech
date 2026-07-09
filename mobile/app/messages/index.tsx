import { Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatBubble, CheckCircle, NavArrowRight, Search, Sparks } from "iconoir-react-native";
import { MessageThread, useMessageThreads } from "@/lib/messages-api";

export default function MessagesInboxScreen() {
  const insets = useSafeAreaInsets();
  const { data: threads = [], isLoading } = useMessageThreads();

  const systemThreads = threads.filter((thread) => thread.kind === "system");
  const directThreads = threads.filter((thread) => thread.kind === "direct");
  const unreadTotal = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="overflow-hidden bg-green-800 px-5 pb-6"
        style={{ paddingTop: insets.top + 14 }}
      >
        <View className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-green-600" />
        <View className="absolute right-8 top-12 h-16 w-16 rounded-full bg-lime-900 opacity-40" />

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-black text-white">Messages</Text>
            <Text className="mt-1 text-sm font-black text-green-100">
              {unreadTotal > 0 ? `${unreadTotal} unread updates` : "All caught up"}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <ChatBubble color="#FFFFFF" width={24} height={24} strokeWidth={2} />
          </View>
        </View>

        <View className="mt-5 min-h-12 flex-row items-center rounded-2xl bg-white px-4">
          <Search color="#9CA3AF" width={20} height={20} strokeWidth={2} />
          <TextInput
            placeholder="Search chats, farmers, updates..."
            placeholderTextColor="#98A1B2"
            className="ml-2 flex-1 text-sm font-black text-gray-950"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#15803D" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-28 pt-5"
        >
          <View className="rounded-3xl bg-white p-4 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-black uppercase text-gray-400">
                System
              </Text>
              <Sparks color="#F59E0B" width={18} height={18} strokeWidth={2} />
            </View>
            {systemThreads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} featured />
            ))}
          </View>

          <Text className="mb-3 mt-6 text-sm font-black uppercase text-gray-400">
            Chats
          </Text>
          <View className="gap-3">
            {directThreads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ThreadRow({
  thread,
  featured = false,
}: {
  thread: MessageThread;
  featured?: boolean;
}) {
  return (
    <Link href={{ pathname: "/messages/[id]", params: { id: thread.id } } as any} asChild>
      <Pressable
        className={`flex-row items-center rounded-2xl active:opacity-80 ${
          featured ? "bg-green-50 p-3" : "bg-white p-4 shadow-sm"
        }`}
      >
        <View
          className={`h-14 w-14 items-center justify-center rounded-2xl ${
            thread.kind === "system" ? "bg-green-800" : "bg-green-50"
          }`}
        >
          <Text
            className={`text-base font-black ${
              thread.kind === "system" ? "text-white" : "text-green-800"
            }`}
          >
            {thread.actor.initials}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="flex-1 text-base font-black text-gray-950" numberOfLines={1}>
              {thread.title}
            </Text>
            {thread.kind === "system" ? (
              <CheckCircle color="#166534" fill="#DCFCE7" width={15} height={15} strokeWidth={2} />
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs font-black text-gray-400" numberOfLines={1}>
            {thread.subtitle}
          </Text>
          <Text className="mt-1.5 text-sm font-semibold text-gray-600" numberOfLines={1}>
            {thread.lastMessage}
          </Text>
        </View>

        <View className="ml-3 items-end">
          <Text className="text-[11px] font-black text-gray-400">{thread.lastMessageAt}</Text>
          {thread.unreadCount > 0 ? (
            <View className="mt-2 h-6 min-w-6 items-center justify-center rounded-full bg-yellow-400 px-2">
              <Text className="text-[11px] font-black text-green-950">
                {thread.unreadCount}
              </Text>
            </View>
          ) : (
            <NavArrowRight color="#D1D5DB" width={18} height={18} strokeWidth={2} />
          )}
        </View>
      </Pressable>
    </Link>
  );
}
