import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserRole, useAuthStore } from "@vegelink/shared";
import { useUserSettingsStore } from "@/lib/user-settings-store";
import { marketplaceListings } from "@/lib/marketplace-data";
import { getProduceEmoji } from "@/lib/utils";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { vlClassNames, vlColors, vlStyles } from "@/lib/design-system";
import {
  User,
  Bell,
  Heart,
  Language,
  Phone,
  LogOut,
  NavArrowRight,
  Star,
  Check,
  Trash,
} from "iconoir-react-native";

const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer Account",
  buyer: "Buyer Account",
  transporter: "Transporter Account",
  agent: "Agent Account",
  admin: "Admin Account",
};

const regions = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "Northern",
  "North East",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

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
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  
  const {
    savedListingIds,
    language,
    region,
    notifications,
    toggleSaveListing,
    setLanguage,
    setRegion,
    toggleNotification,
  } = useUserSettingsStore();

  const fullName = user?.fullName ?? "Kofi Mensah";
  const role = user?.role ?? "buyer";

  // Modal control state
  const [activeModal, setActiveModal] = useState<"edit_profile" | "notifications" | "saved" | "language" | "help" | null>(null);

  // Edit Profile form state
  const [editFullName, setEditFullName] = useState(fullName);
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editRegionState, setEditRegionState] = useState(region);

  const handleLogout = () => {
    clearAuth();
    router.replace("/(auth)/login");
  };

  const handleSaveProfile = () => {
    if (user && accessToken) {
      setAuth(
        {
          ...user,
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
        },
        accessToken
      );
      setRegion(editRegionState);
      setActiveModal(null);
    }
  };

  const savedListings = marketplaceListings.filter((l) =>
    savedListingIds.includes(l.id)
  );

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
                {region} Region
              </Text>
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <StatTile value="3" label="Orders" />
            <StatTile value={savedListingIds.length.toString()} label="Saved" />
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
            <ProfileRow
              label="Edit Profile"
              icon={User}
              tone="green"
              onPress={() => {
                setEditFullName(fullName);
                setEditPhone(user?.phone ?? "");
                setEditRegionState(region);
                setActiveModal("edit_profile");
              }}
            />

            <ProfileRow
              label="Notifications"
              icon={Bell}
              tone="amber"
              onPress={() => setActiveModal("notifications")}
            />

            <ProfileRow
              label="Saved Produce"
              icon={Heart}
              tone="red"
              onPress={() => setActiveModal("saved")}
            />

            <ProfileRow
              label={`Language: ${language}`}
              icon={Language}
              tone="blue"
              onPress={() => setActiveModal("language")}
            />

            <ProfileRow
              label="Help & Support"
              icon={Phone}
              tone="purple"
              onPress={() => setActiveModal("help")}
            />

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

      {/* Settings Action sheets using single control state */}
      <BottomSheet
        visible={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === "edit_profile"
            ? "Edit Profile"
            : activeModal === "notifications"
            ? "Notifications Settings"
            : activeModal === "saved"
            ? "Saved Produce"
            : activeModal === "language"
            ? "Select Language"
            : activeModal === "help"
            ? "Help & Support"
            : ""
        }
      >
        {activeModal === "edit_profile" && (
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="gap-4 py-2">
              <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-500">Full Name</Text>
                <TextInput
                  value={editFullName}
                  onChangeText={setEditFullName}
                  className={vlClassNames.input}
                  placeholder="Full Name"
                />
              </View>
              <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-500">Phone Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  className={vlClassNames.input}
                  keyboardType="phone-pad"
                  placeholder="Phone Number"
                />
              </View>
              <View>
                <Text className="mb-2 text-xs font-black uppercase text-gray-500">Region</Text>
                <View className="flex-row flex-wrap gap-2">
                  {regions.map((r) => {
                    const active = editRegionState === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setEditRegionState(r)}
                        className={`px-3 py-2 rounded-xl border ${
                          active ? "bg-green-50 border-green-800" : "bg-white border-gray-200"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${active ? "text-green-800" : "text-gray-600"}`}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Pressable
                className={vlClassNames.primaryButton}
                onPress={handleSaveProfile}
                style={vlStyles.primaryButtonShadow}
              >
                <Text className={vlClassNames.primaryButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {activeModal === "notifications" && (
          <View className="gap-4 py-2">
            <NotificationRow
              title="Order Updates"
              description="Get notified about status changes of your orders"
              isActive={notifications.orderUpdates}
              onToggle={() => toggleNotification("orderUpdates")}
            />
            <NotificationRow
              title="Price Alerts"
              description="Be notified when crop prices change significantly"
              isActive={notifications.priceAlerts}
              onToggle={() => toggleNotification("priceAlerts")}
            />
            <NotificationRow
              title="Special Offers"
              description="Receive deals and promotions from transporters and buyers"
              isActive={notifications.specialOffers}
              onToggle={() => toggleNotification("specialOffers")}
            />
            <NotificationRow
              title="Announcements"
              description="Important platform announcements and security updates"
              isActive={notifications.announcements}
              onToggle={() => toggleNotification("announcements")}
            />
          </View>
        )}

        {activeModal === "saved" && (
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            {savedListings.length === 0 ? (
              <View className="items-center py-10">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <Heart color="#EF4444" width={32} height={32} strokeWidth={1.5} />
                </View>
                <Text className="mt-4 text-base font-black text-gray-950">No saved produce</Text>
                <Text className="mt-2 text-center text-xs font-semibold text-gray-400">
                  Items you save from the marketplace will show up here.
                </Text>
              </View>
            ) : (
              <View className="gap-3 py-2">
                {savedListings.map((item) => (
                  <Pressable
                    key={item.id}
                    className="flex-row items-center rounded-2xl bg-gray-50 p-3 active:bg-gray-150"
                    onPress={() => {
                      setActiveModal(null);
                      router.push({ pathname: "/listings/[id]", params: { id: item.id } });
                    }}
                  >
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Text className="text-2xl">{getProduceEmoji(item.cropName)}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-black text-gray-950">{item.cropName}</Text>
                      <Text className="text-xs font-bold text-red-600">GH₵{item.pricePerUnit}/{item.unitOfMeasure}</Text>
                    </View>
                    <Pressable
                      className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-gray-100 shadow-sm"
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSaveListing(item.id);
                      }}
                    >
                      <Trash color="#EF4444" width={16} height={16} strokeWidth={2} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {activeModal === "language" && (
          <View className="gap-2 py-2">
            {["English", "Twi", "Hausa", "Ewe"].map((lang) => {
              const selected = language === lang;
              return (
                <Pressable
                  key={lang}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 ${
                    selected ? "bg-green-50" : "active:bg-gray-50"
                  }`}
                  onPress={() => {
                    setLanguage(lang);
                    setActiveModal(null);
                  }}
                >
                  <Text className={`text-base font-bold ${selected ? "text-green-800" : "text-gray-700"}`}>
                    {lang}
                  </Text>
                  {selected && <Check color="#166534" width={20} height={20} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {activeModal === "help" && (
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="gap-4 py-2">
              <Text className="text-xs font-black uppercase text-gray-400">Direct Support</Text>
              
              <View className="flex-row gap-2">
                <Pressable className="flex-1 items-center rounded-2xl bg-green-50 p-4 active:opacity-80">
                  <Phone color="#166534" width={24} height={24} strokeWidth={2} />
                  <Text className="mt-2 text-xs font-black text-green-900">Call Hotline</Text>
                  <Text className="mt-0.5 text-[10px] font-semibold text-green-700">+233 24 123 4567</Text>
                </Pressable>
                
                <Pressable className="flex-1 items-center rounded-2xl bg-purple-50 p-4 active:opacity-80">
                  <Text className="text-xl">💬</Text>
                  <Text className="mt-2 text-xs font-black text-purple-900">WhatsApp</Text>
                  <Text className="mt-0.5 text-[10px] font-semibold text-purple-700">Chat with Agent</Text>
                </Pressable>
              </View>

              <Text className="mt-2 text-xs font-black uppercase text-gray-400">Frequently Asked Questions</Text>
              
              <FAQItem
                question="How do I get paid?"
                answer="Payments are processed securely through Mobile Money (MoMo) upon successful delivery verification."
              />
              <FAQItem
                question="What is the delivery timeline?"
                answer="Most deliveries are handled same day or next day depending on the distance between the farm and pickup point."
              />
              <FAQItem
                question="Can I change my role?"
                answer="To change your role (e.g. from Buyer to Farmer), please contact our administrator support."
              />
            </View>
          </ScrollView>
        )}
      </BottomSheet>
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
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ color: string; width: number; height: number; strokeWidth: number }>;
  tone: keyof typeof toneStyles;
  onPress: () => void;
}) {
  const colors = toneStyles[tone];

  return (
    <Pressable
      className="min-h-[72px] flex-row items-center rounded-2xl bg-white px-4 py-4 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
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

function NotificationRow({
  title,
  description,
  isActive,
  onToggle,
}: {
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
      <View className="flex-1 pr-4">
        <Text className="text-base font-black text-gray-950">{title}</Text>
        <Text className="mt-0.5 text-xs font-semibold text-gray-400">{description}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        className={`h-7 w-12 rounded-full p-1 flex-row items-center ${
          isActive ? "bg-green-850 justify-end" : "bg-gray-200 justify-start"
        }`}
        style={{
          backgroundColor: isActive ? "#0F6A2B" : "#D1D5DB",
        }}
      >
        <View className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </Pressable>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable className="rounded-2xl bg-gray-50 p-4" onPress={() => setOpen(!open)}>
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-sm font-black text-gray-950">{question}</Text>
        <Text className="text-gray-400 font-bold">{open ? "▲" : "▼"}</Text>
      </View>
      {open && <Text className="mt-2 text-xs font-semibold leading-5 text-gray-500">{answer}</Text>}
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
