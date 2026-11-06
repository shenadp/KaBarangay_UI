/**
 * Resident appearance and accessibility preferences.
 *
 * `resources/js/lib/residentSettings.ts` keeps these on the device only — the
 * server never sees them. The values are stored under `SETTINGS_STORAGE_KEY`
 * and painted onto `<html>` by `ResidentLayout`, so every resident page picks
 * up the same appearance without changing its markup.
 */

export type ThemeMode = "light" | "dark" | "system"

export type TextSize = "default" | "large" | "extra-large"

export type ResidentSettings = {
  theme: ThemeMode
  textSize: TextSize
  largeControls: boolean
  highContrast: boolean
  reduceMotion: boolean
  simplifiedView: boolean
  announcementNotifications: boolean
  certificateNotifications: boolean
  luponNotifications: boolean
  disbursementNotifications: boolean
}

export const SETTINGS_STORAGE_KEY = "kabarangay_resident_settings"

/** Every surface that paints the preferences listens for this. */
export const RESIDENT_SETTINGS_EVENT = "kabarangay-settings-changed"

export const defaultResidentSettings: ResidentSettings = {
  theme: "light",
  textSize: "default",
  largeControls: false,
  highContrast: false,
  reduceMotion: false,
  simplifiedView: false,
  announcementNotifications: true,
  certificateNotifications: true,
  luponNotifications: true,
  disbursementNotifications: true,
}

function deviceStore(): Storage | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Anything missing or unusable in the saved blob falls back to the default. */
export function readResidentSettings(): ResidentSettings {
  const saved = deviceStore()?.getItem(SETTINGS_STORAGE_KEY)
  if (!saved) return defaultResidentSettings

  try {
    const parsed = JSON.parse(saved) as Partial<ResidentSettings>

    return {
      theme: isThemeMode(parsed.theme) ? parsed.theme : defaultResidentSettings.theme,
      textSize: isTextSize(parsed.textSize) ? parsed.textSize : defaultResidentSettings.textSize,
      largeControls: readBoolean(parsed.largeControls, defaultResidentSettings.largeControls),
      highContrast: readBoolean(parsed.highContrast, defaultResidentSettings.highContrast),
      reduceMotion: readBoolean(parsed.reduceMotion, defaultResidentSettings.reduceMotion),
      simplifiedView: readBoolean(parsed.simplifiedView, defaultResidentSettings.simplifiedView),
      announcementNotifications: readBoolean(
        parsed.announcementNotifications,
        defaultResidentSettings.announcementNotifications,
      ),
      certificateNotifications: readBoolean(
        parsed.certificateNotifications,
        defaultResidentSettings.certificateNotifications,
      ),
      luponNotifications: readBoolean(
        parsed.luponNotifications,
        defaultResidentSettings.luponNotifications,
      ),
      disbursementNotifications: readBoolean(
        parsed.disbursementNotifications,
        defaultResidentSettings.disbursementNotifications,
      ),
    }
  } catch {
    return defaultResidentSettings
  }
}

/** Persisted, then announced so the open layout repaints without a reload. */
export function saveResidentSettings(settings: ResidentSettings): void {
  try {
    deviceStore()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // A device with no storage keeps the preferences for this session only.
  }

  if (typeof window === "undefined") return

  window.dispatchEvent(new CustomEvent(RESIDENT_SETTINGS_EVENT, { detail: settings }))
}

/** The preferences live on `<html>`: the theme flips the token block, the rest are hooks CSS reads. */
export function applyResidentSettings(settings: ResidentSettings, prefersDark = false): void {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const isDark = settings.theme === "dark" || (settings.theme === "system" && prefersDark)

  root.dataset.residentTheme = isDark ? "dark" : "light"
  root.dataset.residentTextSize = settings.textSize
  root.style.colorScheme = isDark ? "dark" : "light"
  root.classList.toggle("resident-large-controls", settings.largeControls)
  root.classList.toggle("resident-high-contrast", settings.highContrast)
  root.classList.toggle("resident-reduce-motion", settings.reduceMotion)
  root.classList.toggle("resident-simplified-view", settings.simplifiedView)
}

export function prefersDarkMode(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system"
}

function isTextSize(value: unknown): value is TextSize {
  return value === "default" || value === "large" || value === "extra-large"
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}
