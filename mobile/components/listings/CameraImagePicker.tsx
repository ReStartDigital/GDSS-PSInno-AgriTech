import { Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Camera, Check } from "iconoir-react-native";

export function CameraImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View className="mb-4">
      <Pressable
        className={`flex-row items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 active:opacity-80 ${
          imageUri ? "border-green-600 bg-green-50" : "border-gray-300 bg-gray-50"
        }`}
        onPress={pickImage}
      >
        {imageUri ? (
          <Check color="#166534" width={22} height={22} strokeWidth={2.5} />
        ) : (
          <Camera color="#6B7280" width={22} height={22} strokeWidth={2} />
        )}
        <Text
          className={`text-sm font-black ${
            imageUri ? "text-green-800" : "text-gray-500"
          }`}
        >
          {imageUri ? "Image selected — tap to change" : "Tap to upload produce photo"}
        </Text>
      </Pressable>
    </View>
  );
}
