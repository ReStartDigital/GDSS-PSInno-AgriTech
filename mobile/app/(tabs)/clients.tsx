import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { User, Trash, Plus, Check } from "iconoir-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAgentClients, useRegisterClient, useUnassignClient } from "@/lib/user-api";
import { initials } from "@/lib/utils";
import { Alert } from "@/lib/alert-service";

const regions = [
  "Greater Accra",
  "Ashanti",
  "Eastern",
  "Northern",
  "Western",
  "Volta",
] as const;

export default function AgentClientsScreen() {
  const insets = useSafeAreaInsets();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState<(typeof regions)[number]>("Greater Accra");

  const { data: clientsData, isLoading, refetch, isFetching } = useAgentClients();
  const registerMutation = useRegisterClient();
  const unassignMutation = useUnassignClient();

  const clients = clientsData?.data || [];

  const handleRegister = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert("Validation", "Please fill in all fields.", [], { type: "warning" });
      return;
    }

    registerMutation.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        region,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Farmer client registered successfully.", [], { type: "success" });
          setIsRegisterOpen(false);
          setFirstName("");
          setLastName("");
          setPhone("");
          setRegion("Greater Accra");
          refetch();
        },
        onError: (err: any) => {
          Alert.alert("Registration Failed", err.error?.message || "Could not register client.", [], { type: "error" });
        },
      }
    );
  };

  const handleUnassign = (clientId: string, name: string) => {
    Alert.alert(
      "Unassign Client",
      `Are you sure you want to stop representing ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unassign",
          style: "destructive",
          onPress: () =>
            unassignMutation.mutate(clientId, {
              onSuccess: () => {
                Alert.alert("Unassigned", "Client has been removed from your list.", [], { type: "success" });
                refetch();
              },
              onError: (err: any) => {
                Alert.alert("Error", err.error?.message || "Could not unassign client.", [], { type: "error" });
              },
            }),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="My Clients" subtitle="Farmers you represent" />

      {/* Register Floating Action Button */}
      <View className="absolute bottom-6 right-6 z-10">
        <Pressable
          className="h-14 w-14 items-center justify-center rounded-full bg-green-800 shadow-lg active:bg-green-900"
          onPress={() => setIsRegisterOpen(true)}
        >
          <Plus color="#FFFFFF" width={26} height={26} strokeWidth={2.5} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#15803D" />
        </View>
      ) : clients.length === 0 ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1 items-center px-8 pt-20"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#15803D" />
          }
        >
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-green-50">
            <User color="#15803D" width={44} height={44} strokeWidth={1.5} />
          </View>

          <Text className="mt-6 text-center text-xl font-black text-gray-950">
            No clients yet
          </Text>
          <Text className="mt-3 max-w-xs text-center text-base leading-7 text-gray-400">
            {"Click the '+' button to register and represent your first farmer client."}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-5 pb-24 gap-3"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#15803D" />
          }
        >
          {clients.map((client) => {
            const clientName = `${client.firstName} ${client.lastName}`;
            return (
              <View
                key={client.id}
                className="rounded-2xl border border-gray-150 bg-white p-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center flex-1">
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                    <Text className="text-base font-black text-green-800">
                      {initials(clientName)}
                    </Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-black text-gray-950" numberOfLines={1}>
                      {clientName}
                    </Text>
                    <Text className="text-xs font-semibold text-gray-400 mt-0.5">
                      {client.phone} · {client.region || "No Region"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  className="h-11 w-11 items-center justify-center rounded-xl bg-red-50 border border-red-100 active:bg-red-100 ml-2"
                  onPress={() => handleUnassign(client.id, clientName)}
                  disabled={unassignMutation.isPending}
                >
                  <Trash color="#DC2626" width={18} height={18} strokeWidth={2.5} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Register Client Modal */}
      <Modal visible={isRegisterOpen} animationType="slide" transparent>
        <Pressable
          className="flex-1 bg-black/45 justify-end"
          onPress={() => setIsRegisterOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pt-5 pb-8 gap-4"
            style={{ paddingBottom: Math.max(insets.bottom, 28) }}
          >
            <Text className="text-2xl font-black text-gray-950">Register New Farmer</Text>

            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Abena"
                placeholderTextColor="#9CA3AF"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-extrabold text-gray-950"
              />
            </View>

            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Mensah"
                placeholderTextColor="#9CA3AF"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-extrabold text-gray-950"
              />
            </View>

            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +233241234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-extrabold text-gray-950"
              />
            </View>

            <View>
              <Text className="mb-2 text-xs font-black uppercase text-gray-400">Region</Text>
              <View className="flex-row flex-wrap gap-2">
                {regions.map((reg) => (
                  <Pressable
                    key={reg}
                    onPress={() => setRegion(reg)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      region === reg ? "bg-green-50 border-green-800" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-black ${
                        region === reg ? "text-green-800" : "text-gray-700"
                      }`}
                    >
                      {reg}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              className="mt-4 h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-green-800 active:bg-green-900"
              onPress={handleRegister}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Check color="#FFFFFF" width={20} height={20} strokeWidth={2.5} />
                  <Text className="text-base font-black text-white">Submit Registration</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
