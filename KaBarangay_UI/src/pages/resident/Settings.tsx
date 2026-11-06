/**
 * Resident portal — settings.
 *
 * `Resident\SettingsController` only ever hands this page a `flash.success`,
 * because everything else it shows lives on the device: `resources/js/lib/residentSettings.ts`
 * reads and writes `kabarangay_resident_settings` in localStorage and
 * `ResidentLayout` paints the result onto `<html>`.
 *
 * UI-only: the password rules are the ones `SettingsController::updatePassword()`
 * enforces, and no preference is ever sent anywhere.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  Accessibility,
  Bell,
  Check,
  Eye,
  Lock,
  Moon,
  Monitor,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/Panel"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  defaultResidentSettings,
  readResidentSettings,
  saveResidentSettings,
  type ResidentSettings,
  type TextSize,
  type ThemeMode,
} from "@/lib/residentSettings"
import { chatbotStorageKey } from "@/mock/resident/assistant"
import { CERTIFICATE_FLOW_KEY } from "@/mock/resident/certificates"
import { changePassword } from "@/mock/resident/session"

/** What the assistant fires so the chat window can empty itself. */
const ASSISTANT_CLEARED_EVENT = "kabarangay-assistant-cleared"

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string; sample: string }[] = [
  { value: "default", label: "Default", sample: "text-sm" },
  { value: "large", label: "Large", sample: "text-lg" },
  { value: "extra-large", label: "Extra Large", sample: "text-xl" },
]

/** Only the toggles, so a switch row can never point at the theme or text size. */
type SwitchSetting = {
  [K in keyof ResidentSettings]: ResidentSettings[K] extends boolean ? K : never
}[keyof ResidentSettings]

const ACCESSIBILITY_ROWS: { key: SwitchSetting; title: string; description: string }[] = [
  { key: "largeControls", title: "Large Controls", description: "Makes buttons and important controls easier to tap." },
  { key: "highContrast", title: "High Contrast", description: "Strengthens text, borders, and visual separation." },
  { key: "reduceMotion", title: "Reduce Motion", description: "Minimizes animations and moving transitions." },
  {
    key: "simplifiedView",
    title: "Simplified View",
    description: "Removes extra shadows and decorative effects for a cleaner interface.",
  },
]

const NOTIFICATION_ROWS: { key: SwitchSetting; title: string; description: string }[] = [
  {
    key: "announcementNotifications",
    title: "Announcements",
    description: "Barangay advisories, events, and important public notices.",
  },
  {
    key: "certificateNotifications",
    title: "Certificate Updates",
    description: "Changes to your certificate request status.",
  },
  { key: "luponNotifications", title: "Lupon Updates", description: "Complaint status and hearing schedule updates." },
  {
    key: "disbursementNotifications",
    title: "Disbursement Alerts",
    description: "Know when you are included or when assistance is ready for claim.",
  },
]

const EMPTY_PASSWORD = { current_password: "", password: "", password_confirmation: "" }

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 transition-colors",
        selected
          ? "border-brand bg-brand-soft text-brand-deep ring-1 ring-brand"
          : "border-line-soft bg-surface text-ink-muted hover:bg-canvas",
      )}
    >
      {children}
    </button>
  )
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
  last = false,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  last?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-4",
        last ? "" : "border-b border-line-soft",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink-strong">{title}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              checked ? "bg-success-soft text-success" : "bg-canvas text-ink-muted",
            )}
          >
            {checked ? "ON" : "OFF"}
          </span>
        </div>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
        className="shrink-0"
      />
    </div>
  )
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-line-soft bg-surface px-2.5 py-1.5 text-xs">
      <span className="text-ink-faint">{label}:</span>
      <span className="font-semibold text-brand">{value}</span>
    </span>
  )
}

function ActionRow({
  title,
  description,
  button,
  danger = false,
  onClick,
}: {
  title: string
  description: string
  button: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-strong">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-10 shrink-0",
          danger && "border-destructive/40 text-destructive hover:bg-danger-soft hover:text-destructive",
        )}
        onClick={onClick}
      >
        {button}
      </Button>
    </div>
  )
}

function SettingCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Sun
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Panel>
      <PanelHeader className="items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Icon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <PanelTitle>{title}</PanelTitle>
            <PanelDescription>{description}</PanelDescription>
          </div>
        </div>
      </PanelHeader>
      <PanelContent>{children}</PanelContent>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const navigate = useNavigate()

  const [settings, setSettings] = useState<ResidentSettings>(defaultResidentSettings)
  const [loaded, setLoaded] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const [showClearChat, setShowClearChat] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [flash, setFlash] = useState<string | null>(null)
  const [password, setPassword] = useState(EMPTY_PASSWORD)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<string, string>>>({})
  const [updating, setUpdating] = useState(false)

  /** The first write is the page re-saving what it just read, so it stays quiet. */
  const initialSettingsLoad = useRef(true)

  useEffect(() => {
    setSettings(readResidentSettings())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return

    saveResidentSettings(settings)

    if (initialSettingsLoad.current) {
      initialSettingsLoad.current = false

      return
    }

    setShowSaved(true)

    const timer = window.setTimeout(() => setShowSaved(false), 1000)

    return () => window.clearTimeout(timer)
  }, [settings, loaded])

  const updateSetting = <K extends keyof ResidentSettings>(key: K, value: ResidentSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const clearChatHistory = () => {
    try {
      window.localStorage.removeItem(chatbotStorageKey())
      window.localStorage.removeItem(CERTIFICATE_FLOW_KEY)
    } catch {
      // A device that refuses storage simply keeps the conversation.
    }

    window.dispatchEvent(new Event(ASSISTANT_CLEARED_EVENT))

    setShowClearChat(false)
  }

  const openPasswordModal = () => {
    setPassword(EMPTY_PASSWORD)
    setPasswordErrors({})
    setShowPasswordModal(true)
  }

  const closePasswordModal = () => {
    if (updating) return

    setShowPasswordModal(false)
    setPassword(EMPTY_PASSWORD)
    setPasswordErrors({})
  }

  const submitPassword = (event: FormEvent) => {
    event.preventDefault()

    setUpdating(true)
    const outcome = changePassword({
      currentPassword: password.current_password,
      password: password.password,
      confirmPassword: password.password_confirmation,
    })
    setUpdating(false)

    if (!outcome.ok) {
      setPasswordErrors({ [outcome.field]: outcome.message })

      return
    }

    setShowPasswordModal(false)
    setPassword(EMPTY_PASSWORD)
    setPasswordErrors({})
    setFlash("Your password has been updated.")
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink-strong">Settings</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">
            Personalize KaBarangay for a more comfortable and accessible experience.
          </p>
        </div>

        <div className="min-h-7">
          {showSaved && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <Check className="size-3.5" /> Changes saved
            </span>
          )}
        </div>
      </header>

      {flash && (
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success"
        >
          {flash}
        </div>
      )}

      <SettingCard
        icon={Palette}
        title="Appearance"
        description="Changes apply immediately across the Resident Portal."
      >
        <div>
          <p className="text-sm font-medium text-ink-strong">Color theme</p>
          <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-ink-muted">
            Choose the appearance that is comfortable for your eyes.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon

            return (
              <ChoiceButton
                key={option.value}
                selected={settings.theme === option.value}
                onClick={() => updateSetting("theme", option.value)}
              >
                <Icon className="size-5" />
                <span className="text-xs font-semibold sm:text-sm">{option.label}</span>
              </ChoiceButton>
            )
          })}
        </div>
      </SettingCard>

      <SettingCard
        icon={Accessibility}
        title="Accessibility"
        description="Helpful options for seniors, PWD users, and residents who prefer easier controls."
      >
        <div>
          <p className="text-sm font-medium text-ink-strong">Text size</p>
          <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-ink-muted">
            Adjust text throughout the Resident Portal.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {TEXT_SIZE_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={settings.textSize === option.value}
              onClick={() => updateSetting("textSize", option.value)}
            >
              <span className={cn("font-bold", option.sample)}>Aa</span>
              <span className="text-[10px] font-semibold sm:text-xs">{option.label}</span>
            </ChoiceButton>
          ))}
        </div>

        <div className="mt-4">
          {ACCESSIBILITY_ROWS.map((row, index) => (
            <SwitchRow
              key={row.key}
              title={row.title}
              description={row.description}
              checked={settings[row.key]}
              onChange={(value) => updateSetting(row.key, value)}
              last={index === ACCESSIBILITY_ROWS.length - 1}
            />
          ))}
        </div>
      </SettingCard>

      <Panel className="border-brand-muted bg-brand-soft">
        <PanelContent className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-brand">
            <Eye className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-strong">Accessibility Preview</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              This panel changes together with your settings. Try changing text size, contrast, or
              motion options.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip
                label="Text"
                value={
                  settings.textSize === "default"
                    ? "Default"
                    : settings.textSize === "large"
                      ? "Large"
                      : "Extra Large"
                }
              />
              <StatusChip label="Controls" value={settings.largeControls ? "Large" : "Default"} />
              <StatusChip label="Contrast" value={settings.highContrast ? "High" : "Normal"} />
              <StatusChip label="Motion" value={settings.reduceMotion ? "Reduced" : "Normal"} />
            </div>
          </div>
        </PanelContent>
      </Panel>

      <SettingCard
        icon={Bell}
        title="Notifications"
        description="Choose which resident updates you want to receive."
      >
        {NOTIFICATION_ROWS.map((row, index) => (
          <SwitchRow
            key={row.key}
            title={row.title}
            description={row.description}
            checked={settings[row.key]}
            onChange={(value) => updateSetting(row.key, value)}
            last={index === NOTIFICATION_ROWS.length - 1}
          />
        ))}

        <p className="mt-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning">
          These preferences are saved on this device. Push, email, and SMS notification delivery is
          not available in KaBarangay yet.
        </p>
      </SettingCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard icon={ShieldCheck} title="Privacy" description="Manage locally stored information.">
          <ActionRow
            title="KaBarangay Assistant History"
            description="Delete the saved chatbot conversation on this device."
            button="Clear"
            danger
            onClick={() => setShowClearChat(true)}
          />
        </SettingCard>

        <SettingCard icon={Lock} title="Account & Security" description="Manage your resident account.">
          <div className="divide-y divide-line-soft">
            <ActionRow
              title="Change Password"
              description="Update your resident account password."
              button="Change"
              onClick={openPasswordModal}
            />
            <ActionRow
              title="Log Out"
              description="Sign out of this resident account."
              button="Log Out"
              danger
              onClick={() => setShowLogout(true)}
            />
          </div>
        </SettingCard>
      </div>

      <div className="flex justify-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="h-10 px-3 text-sm text-ink-muted hover:text-ink-strong"
          onClick={() => setShowReset(true)}
        >
          Reset accessibility settings
        </Button>
      </div>

      <Dialog open={showClearChat} onOpenChange={setShowClearChat}>
        <DialogContent className="max-w-sm rounded-xl border-line-soft p-5 gap-0">
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-destructive">
              <Trash2 className="size-5" />
            </span>
            <DialogTitle className="mt-4 text-base">Clear chatbot history?</DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-xs text-sm leading-relaxed">
              Your saved KaBarangay Assistant conversation on this device will be removed.
            </DialogDescription>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11" onClick={() => setShowClearChat(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" className="h-11" onClick={clearChatHistory}>
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-sm rounded-xl border-line-soft p-5 gap-0"
        >
          <DialogTitle className="text-base pr-8">Are you sure you want to log out?</DialogTitle>
          <DialogFooter className="mt-4 flex-row gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setShowLogout(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 flex-1"
              onClick={() => navigate("/resident/login")}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-sm rounded-xl border-line-soft p-5 gap-0"
        >
          <DialogTitle className="text-base pr-8">
            Reset all accessibility and appearance settings?
          </DialogTitle>
          <DialogFooter className="mt-4 flex-row gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setShowReset(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 flex-1"
              onClick={() => {
                setSettings(defaultResidentSettings)
                setShowReset(false)
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPasswordModal}
        onOpenChange={(open) => {
          if (!open) closePasswordModal()
        }}
      >
        <DialogContent className="max-w-md rounded-xl border-line-soft p-5 gap-0">
          <DialogTitle className="text-base pr-8">Change Password</DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-relaxed">
            Enter your current and new password.
          </DialogDescription>

          <form onSubmit={submitPassword} className="mt-5 space-y-4">
            <PasswordField
              id="current-password"
              label="Current Password"
              autoComplete="current-password"
              value={password.current_password}
              onChange={(value) => setPassword((current) => ({ ...current, current_password: value }))}
              error={passwordErrors.current_password}
              disabled={updating}
            />

            <PasswordField
              id="new-password"
              label="New Password"
              autoComplete="new-password"
              value={password.password}
              onChange={(value) => setPassword((current) => ({ ...current, password: value }))}
              error={passwordErrors.password}
              hint="Use at least 8 characters."
              disabled={updating}
            />

            <PasswordField
              id="confirm-new-password"
              label="Confirm New Password"
              autoComplete="new-password"
              value={password.password_confirmation}
              onChange={(value) =>
                setPassword((current) => ({ ...current, password_confirmation: value }))
              }
              error={passwordErrors.password_confirmation}
              disabled={updating}
            />

            <Button type="submit" className="h-11 w-full" disabled={updating}>
              {updating ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  autoComplete: string
  disabled: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="h-11 bg-surface"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
