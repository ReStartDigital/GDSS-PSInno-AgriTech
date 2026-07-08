import { create } from "zustand";

interface NotificationsConfig {
  orderUpdates: boolean;
  priceAlerts: boolean;
  specialOffers: boolean;
  announcements: boolean;
}

interface UserSettingsState {
  savedListingIds: string[];
  language: string;
  region: string;
  notifications: NotificationsConfig;
  toggleSaveListing: (id: string) => void;
  isSaved: (id: string) => boolean;
  setLanguage: (lang: string) => void;
  setRegion: (region: string) => void;
  toggleNotification: (key: keyof NotificationsConfig) => void;
}

export const useUserSettingsStore = create<UserSettingsState>((set, get) => ({
  savedListingIds: [],
  language: "English",
  region: "Greater Accra",
  notifications: {
    orderUpdates: true,
    priceAlerts: false,
    specialOffers: true,
    announcements: false,
  },

  toggleSaveListing: (id) =>
    set((state) => {
      const exists = state.savedListingIds.includes(id);
      if (exists) {
        return { savedListingIds: state.savedListingIds.filter((item) => item !== id) };
      } else {
        return { savedListingIds: [...state.savedListingIds, id] };
      }
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
}));
