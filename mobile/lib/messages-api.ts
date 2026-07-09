import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

export type MessageThreadKind = "system" | "direct";
export type MessageSender = "me" | "them" | "system";

export interface MessagePreviewActor {
  id: string;
  name: string;
  roleLabel: string;
  initials: string;
}

export interface MessageThread {
  id: string;
  kind: MessageThreadKind;
  title: string;
  subtitle: string;
  actor: MessagePreviewActor;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  listingId?: string;
  listingTitle?: string;
  listingImageUrl?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  sender: MessageSender;
  body: string;
  sentAt: string;
  status?: "sent" | "delivered" | "read";
}

export interface ListingThreadSeed {
  listingId: string;
  listingTitle: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  listingImageUrl?: string;
}

const systemActor: MessagePreviewActor = {
  id: "system",
  name: "VegeLink System",
  roleLabel: "Platform updates",
  initials: "VL",
};

const mockThreads: MessageThread[] = [
  {
    id: "system",
    kind: "system",
    title: "System Messages",
    subtitle: "Orders, payments, listings, and account notices",
    actor: systemActor,
    lastMessage: "Your listing image uploads now support up to 8 photos.",
    lastMessageAt: "08:20",
    unreadCount: 2,
  },
  {
    id: "chat-farmer-abena-mensah",
    kind: "direct",
    title: "Abena Mensah Farms",
    subtitle: "Farmer · Tomatoes",
    actor: {
      id: "farmer-abena-mensah",
      name: "Abena Mensah Farms",
      roleLabel: "Farmer",
      initials: "AM",
    },
    lastMessage: "I can harvest 50kg tomorrow morning if that works.",
    lastMessageAt: "Yesterday",
    unreadCount: 1,
    listingId: "listing-fresh-tomatoes",
    listingTitle: "Fresh Tomatoes",
  },
  {
    id: "chat-agent-kojo",
    kind: "direct",
    title: "Kojo Mensah",
    subtitle: "VegeLink field agent",
    actor: {
      id: "agent-kojo",
      name: "Kojo Mensah",
      roleLabel: "Agent",
      initials: "KM",
    },
    lastMessage: "I have confirmed the buyer pickup window.",
    lastMessageAt: "Mon",
    unreadCount: 0,
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  system: [
    {
      id: "system-1",
      threadId: "system",
      sender: "system",
      body: "Welcome to VegeLink messages. Order updates, listing notices, and account alerts will appear here.",
      sentAt: "07:45",
    },
    {
      id: "system-2",
      threadId: "system",
      sender: "system",
      body: "Your listing image uploads now support up to 8 photos. Add clear produce photos to help buyers decide faster.",
      sentAt: "08:20",
    },
  ],
  "chat-farmer-abena-mensah": [
    {
      id: "abena-1",
      threadId: "chat-farmer-abena-mensah",
      sender: "me",
      body: "Hello Abena, are the tomatoes still available?",
      sentAt: "16:12",
      status: "read",
    },
    {
      id: "abena-2",
      threadId: "chat-farmer-abena-mensah",
      sender: "them",
      body: "Yes, I still have stock. They were sorted this afternoon.",
      sentAt: "16:16",
    },
    {
      id: "abena-3",
      threadId: "chat-farmer-abena-mensah",
      sender: "them",
      body: "I can harvest 50kg tomorrow morning if that works.",
      sentAt: "16:17",
    },
  ],
  "chat-agent-kojo": [
    {
      id: "kojo-1",
      threadId: "chat-agent-kojo",
      sender: "them",
      body: "I have confirmed the buyer pickup window.",
      sentAt: "09:05",
    },
    {
      id: "kojo-2",
      threadId: "chat-agent-kojo",
      sender: "me",
      body: "Great. Please share the pickup notes once ready.",
      sentAt: "09:08",
      status: "delivered",
    },
  ],
};

function createListingThreadId(listingId: string, farmerId: string) {
  return `listing-${listingId}-${farmerId}`.replace(/[^a-zA-Z0-9-_]/g, "-");
}

function getSeededListingThread(seed: ListingThreadSeed): MessageThread {
  return {
    id: createListingThreadId(seed.listingId, seed.farmerId),
    kind: "direct",
    title: seed.farmerName,
    subtitle: `Farmer · ${seed.listingTitle}`,
    actor: {
      id: seed.farmerId,
      name: seed.farmerName,
      roleLabel: "Farmer",
      initials: seed.farmerName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    },
    lastMessage: `Ask about ${seed.listingTitle}, quantity, pickup, or delivery.`,
    lastMessageAt: "New",
    unreadCount: 0,
    listingId: seed.listingId,
    listingTitle: seed.listingTitle,
    listingImageUrl: seed.listingImageUrl,
  };
}

export function useMessageThreads() {
  return useQuery({
    queryKey: ["messages", "threads"],
    queryFn: async () => mockThreads,
  });
}

export function useMessageThread(threadId: string, seed?: ListingThreadSeed) {
  return useQuery({
    queryKey: ["messages", "thread", threadId, seed],
    queryFn: async () => {
      const seededThread = seed ? getSeededListingThread(seed) : null;
      const thread =
        mockThreads.find((item) => item.id === threadId) || seededThread;

      if (!thread) {
        return null;
      }

      const seededMessages: ChatMessage[] = seededThread
        ? [
            {
              id: `${seededThread.id}-intro`,
              threadId: seededThread.id,
              sender: "system",
              body: `Conversation started from ${seededThread.listingTitle}. Share quantity, timing, pickup, or delivery questions here.`,
              sentAt: "Now",
            },
          ]
        : [];

      return {
        thread,
        messages: mockMessages[thread.id] || seededMessages,
      };
    },
    enabled: !!threadId,
  });
}

export function useLocalThreadMessages(initialMessages: ChatMessage[]) {
  const [messages, setMessages] = useState(initialMessages);

  const sendMutation = useMutation({
    mutationFn: async (body: string) => body.trim(),
    onSuccess: (body) => {
      if (!body) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          threadId: current[0]?.threadId || "local-thread",
          sender: "me",
          body,
          sentAt: "Now",
          status: "sent",
        },
      ]);
    },
  });

  return useMemo(
    () => ({
      messages,
      sendMessage: sendMutation.mutate,
      isSending: sendMutation.isPending,
    }),
    [messages, sendMutation.isPending, sendMutation.mutate],
  );
}

export const chatRoutes = {
  listingThreadId: createListingThreadId,
};
