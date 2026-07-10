import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface NotificationsConfig {
  orderUpdates: boolean;
  priceAlerts: boolean;
  specialOffers: boolean;
  announcements: boolean;
}

export interface SavedProduce {
  id: string;
  cropName: string;
  pricePerUnit: number;
  unitOfMeasure: string;
  imageUrl?: string;
}

interface UserSettingsState {
  savedListingIds: string[];
  savedProduces: Record<string, SavedProduce>;
  language: string;
  region: string;
  notifications: NotificationsConfig;
  toggleSaveListing: (id: string, produce?: SavedProduce) => void;
  isSaved: (id: string) => boolean;
  setLanguage: (lang: string) => void;
  setRegion: (region: string) => void;
  toggleNotification: (key: keyof NotificationsConfig) => void;
}

const secureStoreStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      savedListingIds: [],
      savedProduces: {},
      language: "English",
      region: "Greater Accra",
      notifications: {
        orderUpdates: true,
        priceAlerts: false,
        specialOffers: true,
        announcements: false,
      },

      toggleSaveListing: (id, produce) =>
        set((state) => {
          const exists = state.savedListingIds.includes(id);

          if (exists) {
            const { [id]: _removed, ...nextSavedProduces } = state.savedProduces;
            return {
              savedListingIds: state.savedListingIds.filter((item) => item !== id),
              savedProduces: nextSavedProduces,
            };
          }

          return {
            savedListingIds: [...state.savedListingIds, id],
            savedProduces: produce
              ? {
                  ...state.savedProduces,
                  [id]: produce,
                }
              : state.savedProduces,
          };
        }),

      isSaved: (id) => get().savedListingIds.includes(id),

      setLanguage: (language) => set({ language }),

      setRegion: (region) => set({ region }),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
    }),
    {
      name: "vegelink-user-settings",
      storage: createJSONStorage(() => secureStoreStorage),
      partialize: (state) => ({
        savedListingIds: state.savedListingIds,
        savedProduces: state.savedProduces,
        language: state.language,
        region: state.region,
        notifications: state.notifications,
      }),
    },
  ),
);

export function toSavedProduce(produce: {
  id: string;
  cropName: string;
  pricePerUnit: number;
  unitOfMeasure: string;
  imageUrls?: string[];
}): SavedProduce {
  return {
    id: produce.id,
    cropName: produce.cropName,
    pricePerUnit: produce.pricePerUnit,
    unitOfMeasure: produce.unitOfMeasure,
    imageUrl: produce.imageUrls?.[0],
  };
}
