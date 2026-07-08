import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export interface TransportJob {
  orderId: string;
  cropName: string;
  quantityText: string;
  buyerName: string;
  farmerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  payoutGhs: number;
  status: "open" | "accepted" | "in_transit" | "completed";
  transporterId?: string;
  transporterName?: string;
  createdAt: string;
}

interface TransportStoreState {
  jobs: TransportJob[];
  addJob: (job: Omit<TransportJob, "status" | "createdAt">) => void;
  acceptJob: (orderId: string, transporterId: string, transporterName: string) => void;
  startTransit: (orderId: string) => void;
  completeJob: (orderId: string) => void;
  getJobForOrder: (orderId: string) => TransportJob | undefined;
}

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore write errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore delete errors
    }
  },
};

export const useTransportStore = create<TransportStoreState>()(
  persist(
    (set, get) => ({
      jobs: [
        // Seed some initial demo transport jobs for transporters to browse
        {
          orderId: "demo-order-1",
          cropName: "Roma Tomatoes",
          quantityText: "150 kg",
          buyerName: "Ama Serwaa",
          farmerName: "Kofi Mensah",
          pickupAddress: "Kpong Farm, Eastern Region",
          deliveryAddress: "Agbogbloshie Market, Accra",
          payoutGhs: 85.00,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        {
          orderId: "demo-order-2",
          cropName: "Ghana White Yam",
          quantityText: "300 kg",
          buyerName: "Yaw Boateng",
          farmerName: "Kwame Osei",
          pickupAddress: "Techiman Farm, Brong-Ahafo",
          deliveryAddress: "Makola Market, Accra",
          payoutGhs: 175.00,
          status: "open",
          createdAt: new Date().toISOString(),
        },
      ],
      addJob: (job) => set((state) => {
        // Prevent duplicate jobs
        if (state.jobs.some(j => j.orderId === job.orderId)) {
          return state;
        }
        return {
          jobs: [
            ...state.jobs,
            {
              ...job,
              status: "open",
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
      acceptJob: (orderId, transporterId, transporterName) => set((state) => ({
        jobs: state.jobs.map((job) =>
          job.orderId === orderId
            ? { ...job, status: "accepted", transporterId, transporterName }
            : job
        ),
      })),
      startTransit: (orderId) => set((state) => ({
        jobs: state.jobs.map((job) =>
          job.orderId === orderId ? { ...job, status: "in_transit" } : job
        ),
      })),
      completeJob: (orderId) => set((state) => ({
        jobs: state.jobs.map((job) =>
          job.orderId === orderId ? { ...job, status: "completed" } : job
        ),
      })),
      getJobForOrder: (orderId) => {
        return get().jobs.find((job) => job.orderId === orderId);
      },
    }),
    {
      name: "vegelink_transport_jobs",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
