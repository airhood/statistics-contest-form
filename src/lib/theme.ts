import type { ThemeMode } from "./types";

export const tone = {
  light: {
    app: "bg-white text-[#0a0a0a] [color-scheme:light]",
    rootBg: "bg-white",
    soft: "bg-[#fafafa]",
    muteBg: "bg-[#f4f4f5]",
    border: "border-[#e7e7ea]",
    borderStrong: "border-[#d4d4d8]",
    borderAccent: "border-[#3b5bdb]",
    textMute: "text-[#52525b]",
    textSoft: "text-[#a1a1aa]",
    accent: "text-[#3b5bdb]",
    accentBg: "bg-[#3b5bdb]",
    accentText: "text-white",
    accentHover: "hover:bg-[#324dc4]",
    accentSoft: "bg-[#eef2ff]",
    accentColor: "accent-[#3b5bdb]",
    focus: "focus-visible:ring-[#3b5bdb]/20",
    mediaStripe: "bg-[repeating-linear-gradient(135deg,#f4f4f5_0_10px,#fafafa_10px_20px)]",
    waveMuted: "bg-[#d4d4d8]",
  },
  dark: {
    app: "bg-[#0a0a0b] text-[#fafafa] [color-scheme:dark]",
    rootBg: "bg-[#0a0a0b]",
    soft: "bg-[#0f0f11]",
    muteBg: "bg-[#18181b]",
    border: "border-[#232327]",
    borderStrong: "border-[#3a3a40]",
    borderAccent: "border-[#6b86ff]",
    textMute: "text-[#a1a1aa]",
    textSoft: "text-[#52525b]",
    accent: "text-[#6b86ff]",
    accentBg: "bg-[#6b86ff]",
    accentText: "text-[#0a0a0b]",
    accentHover: "hover:bg-[#8099ff]",
    accentSoft: "bg-[#1a2240]",
    accentColor: "accent-[#6b86ff]",
    focus: "focus-visible:ring-[#6b86ff]/25",
    mediaStripe: "bg-[repeating-linear-gradient(135deg,#18181b_0_10px,#0f0f11_10px_20px)]",
    waveMuted: "bg-[#3a3a40]",
  },
} as const;

export type Tone = (typeof tone)[ThemeMode];

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
