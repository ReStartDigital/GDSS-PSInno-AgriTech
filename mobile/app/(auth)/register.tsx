import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRole } from "@vegelink/shared";

const roles: {
  id: UserRole;
  label: string;
  description: string;
  accent: string;
}[] = [
  {
    id: "farmer",
    label: "Farmer",
    description: "List produce, confirm orders, receive mobile money payments.",
    accent: "#15803D",
  },
  {
    id: "buyer",
    label: "Buyer",
    description: "Browse produce, place orders, pay by MoMo, track delivery.",
    accent: "#92400E",
  },
  {
    id: "transporter",
    label: "Transporter",
    description: "Accept nearby delivery jobs and update delivery progress.",
    accent: "#1D4ED8",
  },
  {
    id: "agent",
    label: "Agent",
    description: "Register farmers and help confirm orders in the field.",
    accent: "#6D28D9",
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");

  const cleanedPhone = phone.trim();
  const canContinue =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    cleanedPhone.length >= 10;

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert(
        "Complete your details",
        "Enter your first name, last name, and Ghana phone number.",
      );
      return;
    }

    router.push({
      pathname: "/(auth)/verify",
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanedPhone,
        role,
      },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-16">
        <Text className="text-sm font-semibold uppercase text-green-700">
          VegeLink onboarding
        </Text>
        <Text className="mt-2 text-3xl font-black text-green-950">
          Create your account
        </Text>
        <Text className="mt-2 text-base leading-6 text-gray-600">
          Your phone number is used for OTP, order alerts, and mobile money
          updates.
        </Text>

        <View className="mt-8 gap-4">
          <Field
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Abena"
          />
          <Field
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Mensah"
          />
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="0244123456"
            keyboardType="phone-pad"
          />
        </View>

        <Text className="mt-8 text-lg font-bold text-green-950">Choose role</Text>
        <View className="mt-3 gap-3">
          {roles.map((item) => {
            const isActive = role === item.id;

            return (
              <Pressable
                key={item.id}
                className={`rounded-lg border p-4 ${
                  isActive ? "border-green-800 bg-green-50" : "border-gray-200"
                }`}
                onPress={() => setRole(item.id)}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className="mt-1 h-4 w-4 rounded-full"
                    style={{ backgroundColor: item.accent }}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-950">
                      {item.label}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-gray-600">
                      {item.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          className={`mt-8 rounded-lg py-4 ${
            canContinue ? "bg-green-800 active:bg-green-900" : "bg-gray-300"
          }`}
          onPress={handleContinue}
        >
          <Text
            className={`text-center text-base font-bold ${
              canContinue ? "text-white" : "text-gray-600"
            }`}
          >
            Send OTP
          </Text>
        </Pressable>

        <Pressable className="mt-4 py-3" onPress={() => router.back()}>
          <Text className="text-center font-semibold text-green-800">
            I already have an account
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-950"
      />
    </View>
  );
}
