import { create } from "zustand";

export interface AlertButton {
  text: string;
  onPress?: (inputValue?: string) => void;
  style?: "default" | "cancel" | "destructive";
}

export type AlertType = "success" | "info" | "warning" | "error";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  isPrompt: boolean;
  promptPlaceholder?: string;
  promptValue: string;
  type: AlertType;
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType
  ) => void;
  showPrompt: (
    title: string,
    message: string,
    onSubmit: (text: string) => void,
    placeholder?: string
  ) => void;
  setPromptValue: (val: string) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  buttons: [],
  isPrompt: false,
  promptPlaceholder: "",
  promptValue: "",
  type: "info",
  showAlert: (title, message = "", buttons, type = "info") => {
    // If no buttons are provided, default to a standard "OK" button
    const defaultButtons: AlertButton[] = [
      {
        text: "OK",
        onPress: () => {},
      },
    ];
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : defaultButtons,
      isPrompt: false,
      promptPlaceholder: "",
      promptValue: "",
      type,
    });
  },
  showPrompt: (title, message, onSubmit, placeholder) => {
    set({
      visible: true,
      title,
      message,
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: () => {
            const val = useAlertStore.getState().promptValue;
            onSubmit(val);
          },
        },
      ],
      isPrompt: true,
      promptPlaceholder: placeholder || "Enter value…",
      promptValue: "",
      type: "info",
    });
  },
  setPromptValue: (val) => set({ promptValue: val }),
  hideAlert: () => set({ visible: false }),
}));

/**
 * Drop-in helper object replacing react-native's Alert.
 * Call Alert.alert(title, message, buttons) or Alert.prompt(title, message, callback)
 */
export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { type?: AlertType }
  ) => {
    useAlertStore
      .getState()
      .showAlert(title, message, buttons, options?.type || "info");
  },
  prompt: (
    title: string,
    message: string,
    callback: (text: string) => void,
    type?: any, // Mimic native signature
    defaultValue?: string, // Mimic native signature
    keyboardType?: any // Mimic native signature
  ) => {
    useAlertStore
      .getState()
      .showPrompt(
        title,
        message,
        callback,
        defaultValue || "Type here…"
      );
  },
};
