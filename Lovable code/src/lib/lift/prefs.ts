import { useSyncExternalStore } from "react";

export type Unit = "kg" | "lb";
export type Theme = "system" | "light" | "dark";
type Prefs = { unit: Unit; theme: Theme };

const KEY = "lift:prefs";
const LB_PER_KG = 2.20462;
const DEFAULTS: Prefs = { unit: "kg", theme: "system" };

let current: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    current = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    current = DEFAULTS;
  }
}

export function getPrefs(): Prefs {
  load();
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  load();
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  applyTheme();
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getPrefs,
    () => DEFAULTS,
  );
}

export function applyTheme() {
  if (typeof document === "undefined") return;
  const { theme } = getPrefs();
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Inline script run before paint so dark mode never flashes white. */
export const THEME_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var t=p.theme||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/** Weights are stored in kg; these convert for display and input. */
export function toDisplayWeight(kg: number): number {
  if (getPrefs().unit === "kg") return kg;
  return Math.round(kg * LB_PER_KG * 2) / 2;
}

export function fromDisplayWeight(value: number): number {
  if (getPrefs().unit === "kg") return value;
  return Math.round((value / LB_PER_KG) * 100) / 100;
}

export function unitLabel(): Unit {
  return getPrefs().unit;
}

/** Light tap on supporting phones (Android). Silently ignored elsewhere. */
export function haptic(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
