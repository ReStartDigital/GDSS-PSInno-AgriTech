export const vlColors = {
  brandGreen: "#177A33",
  brandGreenDark: "#0F6A2B",
  brandGreenSoft: "#ECFDF3",
  textInk: "#111827",
  textBody: "#5F6B7A",
  textMuted: "#98A1B2",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F8FA",
  line: "#E5E7EB",
  warning: "#F59E0B",
  danger: "#EF4444",
  blue: "#2563EB",
} as const;

export const vlClassNames = {
  screen: "flex-1 bg-white",
  pagePadding: "px-6",
  eyebrow: "text-xs font-black uppercase",
  title: "text-3xl font-black text-gray-950",
  subtitle: "text-base leading-6 text-gray-600",
  card: "rounded-2xl border border-gray-200 bg-white",
  softCard: "rounded-2xl border border-green-100 bg-green-50",
  input:
    "rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base font-bold text-gray-950",
  primaryButton:
    "w-full rounded-2xl bg-green-800 py-4 active:bg-green-900 shadow-lg",
  primaryButtonText: "text-center text-base font-black text-white",
  mutedButton:
    "w-full rounded-2xl bg-gray-200 py-4 active:bg-gray-300",
  mutedButtonText: "text-center text-base font-black text-gray-500",
} as const;

export const vlRadii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const vlSpacing = {
  screenX: 24,
  sectionGap: 24,
  cardPadding: 16,
  controlHeight: 56,
} as const;
