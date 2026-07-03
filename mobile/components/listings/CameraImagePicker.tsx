import { Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

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
      <Pressable className="rounded-lg border border-dashed border-green-700 py-8" onPress={pickImage}>
        <Text className="text-center text-green-800">
          {imageUri ? "Image selected — tap to change" : "Tap to upload produce photo"}
        </Text>
      </Pressable>
    </View>
  );
}
