import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatBubble, MediaImage, NavArrowLeft, Phone, SendDiagonal } from "iconoir-react-native";
import { ChatMessage, ListingThreadSeed, useMessageThread } from "@/lib/messages-api";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function MessageThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const threadId = firstParam(params.id) || "";
  const [draft, setDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);

  const seed = useMemo<ListingThreadSeed | undefined>(() => {
    const listingId = firstParam(params.listingId);
    const farmerId = firstParam(params.farmerId);
    const listingTitle = firstParam(params.listingTitle);
    const farmerName = firstParam(params.farmerName);

    if (!listingId || !farmerId || !listingTitle || !farmerName) {
      return undefined;
    }

    return {
      listingId,
      farmerId,
      listingTitle,
      farmerName,
      farmerPhone: firstParam(params.farmerPhone),
      listingImageUrl: firstParam(params.listingImageUrl),
    };
  }, [
    params.farmerId,
    params.farmerName,
    params.farmerPhone,
    params.listingId,
    params.listingImageUrl,
    params.listingTitle,
  ]);

  const { data, isLoading } = useMessageThread(threadId, seed);

  const thread = data?.thread;
  const isSystemThread = thread?.kind === "system";
  const visibleMessages = useMemo(
    () => [...(data?.messages || []), ...sentMessages],
    [data?.messages, sentMessages],
  );

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !thread) {
      return;
    }

    setSentMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        threadId: thread.id,
        sender: "me",
        body,
        sentAt: "Now",
        status: "sent",
      },
    ]);
    setDraft("");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#15803D" size="large" />
      </View>
    );
  }

  if (!thread) {
    return (
      <View className="flex-1 bg-white px-6">
        <View className="flex-1 items-center justify-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-green-50">
            <ChatBubble color="#166534" width={34} height={34} strokeWidth={1.7} />
          </View>
          <Text className="mt-5 text-center text-xl font-black text-gray-950">
            Chat not found
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-gray-400">
            This conversation may not be available in the mock inbox yet.
          </Text>
          <Pressable
            className="mt-6 rounded-2xl bg-green-800 px-6 py-4"
            onPress={() => router.replace("/messages" as any)}
          >
            <Text className="font-black text-white">Back to Messages</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <View
        className="flex-row items-center border-b border-gray-100 bg-white px-5 pb-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable
          accessibilityLabel="Back to messages"
          className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"
          onPress={() => router.back()}
        >
          <NavArrowLeft color="#111827" width={23} height={23} strokeWidth={2.5} />
        </Pressable>

        <View className="ml-3 h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-green-50">
          {thread.listingImageUrl ? (
            <Image source={{ uri: thread.listingImageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="text-base font-black text-green-800">{thread.actor.initials}</Text>
          )}
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-base font-black text-gray-950" numberOfLines={1}>
            {thread.title}
          </Text>
          <Text className="mt-0.5 text-xs font-black text-gray-400" numberOfLines={1}>
            {thread.subtitle}
          </Text>
        </View>

        {!isSystemThread ? (
          <Pressable className="h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
            <Phone color="#166534" width={19} height={19} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {thread.listingTitle ? (
        <View className="mx-5 mt-4 flex-row items-center rounded-2xl border border-green-100 bg-green-50 p-3">
          <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
            {thread.listingImageUrl ? (
              <Image source={{ uri: thread.listingImageUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <MediaImage color="#15803D" width={20} height={20} strokeWidth={2} />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-black uppercase text-green-700">
              Listing chat
            </Text>
            <Text className="mt-0.5 text-sm font-black text-gray-950" numberOfLines={1}>
              {thread.listingTitle}
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5 pb-5 pt-5"
      >
        {visibleMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View
        className="border-t border-gray-100 bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {isSystemThread ? (
          <View className="rounded-2xl bg-gray-100 px-4 py-3">
            <Text className="text-center text-sm font-black text-gray-500">
              System messages are read-only for now.
            </Text>
          </View>
        ) : (
          <View className="flex-row items-end gap-3">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              className="max-h-28 min-h-12 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-base font-semibold text-gray-950"
            />
            <Pressable
              accessibilityLabel="Send message"
              disabled={!draft.trim()}
              onPress={handleSend}
              className={`h-12 w-12 items-center justify-center rounded-2xl ${
                draft.trim() ? "bg-green-800" : "bg-green-200"
              }`}
            >
              <SendDiagonal color="#FFFFFF" width={21} height={21} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = message.sender === "me";
  const isSystem = message.sender === "system";

  if (isSystem) {
    return (
      <View className="items-center">
        <View className="max-w-[92%] rounded-2xl bg-green-50 px-4 py-3">
          <Text className="text-center text-sm font-semibold leading-5 text-green-900">
            {message.body}
          </Text>
          <Text className="mt-1 text-center text-[10px] font-black uppercase text-green-600">
            {message.sentAt}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-row ${isMine ? "justify-end" : "justify-start"}`}>
      <View
        className={`max-w-[82%] rounded-3xl px-4 py-3 ${
          isMine ? "rounded-br-md bg-green-800" : "rounded-bl-md bg-white"
        }`}
      >
        <Text
          className={`text-base font-semibold leading-6 ${
            isMine ? "text-white" : "text-gray-800"
          }`}
        >
          {message.body}
        </Text>
        <Text
          className={`mt-1 text-[10px] font-black uppercase ${
            isMine ? "text-green-100" : "text-gray-400"
          }`}
        >
          {message.sentAt}
          {message.status ? ` · ${message.status}` : ""}
        </Text>
      </View>
    </View>
  );
}
