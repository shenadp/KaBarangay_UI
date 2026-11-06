import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Download, ShieldCheck } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import StatusBadge from "@/components/StatusBadge"
import { Panel, PanelDescription, PanelFooter, PanelHeader, PanelTitle } from "@/components/Panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  auditLogCsv,
  barangayDataJson,
  downloadFile,
  residentsCsv,
  staffCsv,
} from "@/mock/admin/exports"
import { adminBarangay } from "@/mock/admin/residents"

/** The account the demo session is signed into, held in local state like the reference. */
const INITIAL_ACCOUNT = {
  name: "Barangay Admin",
  username: "admin.sanisidro@kabarangay.local",
}

/** The controller reads the name from the signed-in account's barangay; a missing row yields null. */
const BARANGAY_NAME: string | null = adminBarangay

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** The grey box a server-owned value is displayed in. */
function ReadOnlyValue({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[42px] items-center rounded-lg border border-line bg-canvas/60 px-3 text-sm text-ink">
      {children}
    </div>
  )
}

/** A `htmlFor` is only rendered when the value is an actual control. */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {htmlFor ? (
        <Label htmlFor={htmlFor}>{label}</Label>
      ) : (
        <p className="text-xs font-medium text-ink">{label}</p>
      )}
      {children}
    </div>
  )
}

/** Rows of the two list panels — toggles and exports share the same rhythm. */
function ListRow({
  title,
  description,
  trailing,
  last = false,
}: {
  title: string
  description: string
  trailing: ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
        last ? "" : "border-b border-line-soft"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-strong">{title}</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
      {trailing}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminSettings() {
  const [account, setAccount] = useState(INITIAL_ACCOUNT)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loginAlerts, setLoginAlerts] = useState(true)
  const [auditLogging, setAuditLogging] = useState(true)
  const [autoLogout, setAutoLogout] = useState(true)

  const [profileMessage, setProfileMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")

  /** Both notices retire themselves after three seconds, as the reference does. */
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const scheduleClear = (clear: () => void) => {
    timers.current.push(window.setTimeout(clear, 3000))
  }

  const handleAccountSave = (event: FormEvent) => {
    event.preventDefault()

    setProfileMessage("Administrator information saved.")
    scheduleClear(() => setProfileMessage(""))
  }

  /** The order the reference checks in: completeness, then match, then length. */
  const handlePasswordChange = (event: FormEvent) => {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please complete all password fields.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.")
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage("New password must contain at least 8 characters.")
      return
    }

    setPasswordMessage("Password updated successfully.")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    scheduleClear(() => setPasswordMessage(""))
  }

  const passwordSucceeded = passwordMessage.includes("successfully")

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Manage barangay information, administrator account, and system security"
      />

      {profileMessage && (
        <p role="status" className="rounded-xl border border-line-soft bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {profileMessage}
        </p>
      )}

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Barangay Information</PanelTitle>
            <PanelDescription>Basic information displayed throughout the system</PanelDescription>
          </div>
        </PanelHeader>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field label="Barangay Name">
            <ReadOnlyValue>{BARANGAY_NAME ?? "Not available"}</ReadOnlyValue>
          </Field>
        </div>

        <PanelFooter className="block">
          <p className="text-[11px] leading-relaxed text-ink-faint">
            Barangay information is managed by the system and cannot be edited here.
          </p>
        </PanelFooter>
      </Panel>

      <form onSubmit={handleAccountSave}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Administrator Account</PanelTitle>
              <PanelDescription>Account information for the current administrator</PanelDescription>
            </div>
          </PanelHeader>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="Administrator Name" htmlFor="admin-settings-name">
              <Input
                id="admin-settings-name"
                name="name"
                autoComplete="name"
                required
                value={account.name}
                onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>

            <Field label="Username" htmlFor="admin-settings-username">
              <Input
                id="admin-settings-username"
                name="username"
                autoComplete="username"
                required
                value={account.username}
                onChange={(event) =>
                  setAccount((current) => ({ ...current, username: event.target.value }))
                }
              />
            </Field>

            <Field label="Role">
              <ReadOnlyValue>
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  Admin / Superuser
                </span>
              </ReadOnlyValue>
            </Field>

            <Field label="Account Status">
              <ReadOnlyValue>
                <StatusBadge status="Active" tone="success" />
              </ReadOnlyValue>
            </Field>
          </div>

          <PanelFooter className="justify-end">
            <Button type="submit">Save Account Information</Button>
          </PanelFooter>
        </Panel>
      </form>

      <form onSubmit={handlePasswordChange}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Change Password</PanelTitle>
              <PanelDescription>Update the password used for this administrator account</PanelDescription>
            </div>
          </PanelHeader>

          <div className="space-y-5 p-5">
            {passwordMessage && (
              <p
                role="status"
                className={`rounded-lg px-4 py-3 text-xs font-medium ${
                  passwordSucceeded ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"
                }`}
              >
                {passwordMessage}
              </p>
            )}

            <Field label="Current Password" htmlFor="admin-settings-current-password">
              <Input
                id="admin-settings-current-password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="New Password" htmlFor="admin-settings-new-password">
                <Input
                  id="admin-settings-new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </Field>

              <Field label="Confirm New Password" htmlFor="admin-settings-confirm-password">
                <Input
                  id="admin-settings-confirm-password"
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
            </div>

            <p className="text-[11px] leading-relaxed text-ink-faint">
              Use at least 8 characters. For production, the backend should enforce stronger
              password validation and securely hash all passwords.
            </p>
          </div>

          <PanelFooter className="justify-end">
            <Button type="submit">Change Password</Button>
          </PanelFooter>
        </Panel>
      </form>

      <Panel>
        <PanelHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <PanelTitle>Security &amp; Activity</PanelTitle>
              <PanelDescription>Configure administrative security monitoring</PanelDescription>
            </div>
          </div>
        </PanelHeader>

        <div>
          <ListRow
            title="Login Security Alerts"
            description="Show security alerts for failed and suspicious login attempts."
            trailing={
              <Switch
                aria-label="Login Security Alerts"
                checked={loginAlerts}
                onCheckedChange={(checked) => setLoginAlerts(checked)}
              />
            }
          />
          <ListRow
            title="Audit Logging"
            description="Record administrator and staff actions in the Audit Log."
            trailing={
              <Switch
                aria-label="Audit Logging"
                checked={auditLogging}
                onCheckedChange={(checked) => setAuditLogging(checked)}
              />
            }
          />
          <ListRow
            title="Automatic Session Logout"
            description="Automatically end inactive administrator sessions for security."
            trailing={
              <Switch
                aria-label="Automatic Session Logout"
                checked={autoLogout}
                onCheckedChange={(checked) => setAutoLogout(checked)}
              />
            }
            last
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Data Export</PanelTitle>
            <PanelDescription>Download a CSV copy of your barangay records</PanelDescription>
          </div>
        </PanelHeader>

        <div>
          <ListRow
            title="Residents List"
            description="Registered residents of this barangay as a CSV file."
            trailing={
              <Button variant="outline" size="sm" onClick={() => downloadFile(residentsCsv())}>
                <Download />
                Export CSV
              </Button>
            }
          />
          <ListRow
            title="Staff List"
            description="Staff accounts of this barangay as a CSV file."
            trailing={
              <Button variant="outline" size="sm" onClick={() => downloadFile(staffCsv())}>
                <Download />
                Export CSV
              </Button>
            }
          />
          <ListRow
            title="Audit Log"
            description="Download your barangay's audit history as a CSV file."
            trailing={
              <Button variant="outline" size="sm" onClick={() => downloadFile(auditLogCsv())}>
                <Download />
                Export Data
              </Button>
            }
          />
          <ListRow
            title="Barangay Data Export (JSON)"
            description="Barangay-scoped data export as a JSON file. Not a restore-verified backup; credentials and uploaded document files are excluded."
            trailing={
              <Button variant="outline" size="sm" onClick={() => downloadFile(barangayDataJson())}>
                <Download />
                Download Data
              </Button>
            }
            last
          />
        </div>
      </Panel>
    </div>
  )
}
