/**
 * Resident portal — profile.
 *
 * `routes/web.php` `/resident/profile` builds the `profile` prop and
 * `resources/js/pages/Resident/Profile.tsx` prints it. The contact form posts to
 * `/resident/profile/contact` (the two columns the resident owns) and the resend
 * link posts to `/resident/email/verification/resend`; both rules live in
 * `@/mock/resident/session`.
 *
 * UI-only: nothing leaves the browser, and the official fields stay read-only
 * because only barangay verification may change them.
 */
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleUserRound,
  Info,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Meta,
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Panel"
import { cn } from "@/lib/utils"
import {
  NOT_PROVIDED,
  profileDetails,
  resendEmailVerification,
  saveContactDetails,
  type ProfileDetails,
} from "@/mock/resident/session"

type Notification = {
  tone: "success" | "error" | "warning"
  title: string
  message: string
}

const NOTIFICATION_STYLES = {
  success: "border-success/30 bg-success-soft text-success",
  error: "border-destructive/30 bg-danger-soft text-destructive",
  warning: "border-warning/30 bg-warning-soft text-warning",
} as const

const NOTIFICATION_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
} as const

export default function Profile() {
  const [profile, setProfile] = useState<ProfileDetails>(profileDetails)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [editingContact, setEditingContact] = useState(false)
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber)
  const [email, setEmail] = useState(profile.email)
  const [savingContact, setSavingContact] = useState(false)
  const [resending, setResending] = useState(false)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const timer = useRef<number | null>(null)

  const show = (next: Notification) => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setNotification(next)
    timer.current = window.setTimeout(() => setNotification(null), 4000)
  }

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const closeNotification = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    setNotification(null)
  }

  const handleCancelEdit = () => {
    setMobileNumber(profile.mobileNumber)
    setEmail(profile.email)
    setEditingContact(false)
  }

  const handleSaveContact = (event: FormEvent) => {
    event.preventDefault()

    if (
      mobileNumber.trim() === profile.mobileNumber.trim() &&
      email.trim() === profile.email.trim()
    ) {
      show({
        tone: "warning",
        title: "No changes made.",
        message: "Your contact information is already up to date.",
      })

      return
    }

    setSavingContact(true)
    const outcome = saveContactDetails({ mobileNumber, email })
    setSavingContact(false)

    if (!outcome.ok) {
      show({ tone: "error", title: "Update failed.", message: outcome.message })

      return
    }

    setProfile(profileDetails())
    setEditingContact(false)
    show({
      tone: "success",
      title: "Successfully updated!",
      message: "Your contact information has been successfully updated.",
    })
  }

  const handleResend = () => {
    setResending(true)
    const outcome = resendEmailVerification()
    setResending(false)
    setVerificationLink(outcome.link)

    show(
      outcome.ok
        ? {
            tone: "success",
            title: "Verification sent.",
            message: "Check your email for the verification link.",
          }
        : {
            tone: "error",
            title: "Unable to resend.",
            message: "Wait a minute and try again.",
          },
    )
  }

  const age = profile.age > 0 ? `${profile.age} years old` : NOT_PROVIDED

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-strong">My Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          View your resident information and manage your contact details.
        </p>
      </header>

      {notification && (
        <div
          role="alert"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3",
            NOTIFICATION_STYLES[notification.tone],
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {(() => {
              const Icon = NOTIFICATION_ICONS[notification.tone]

              return <Icon className="mt-0.5 size-4 shrink-0" />
            })()}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink">{notification.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeNotification}
            aria-label="Close notification"
            className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-black/5 hover:text-ink-strong"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Panel>
        <PanelContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <CircleUserRound className="size-8" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold tracking-tight text-ink-strong">
                  {profile.fullName}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <Check className="size-3" /> Verified
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink-muted tnum">{profile.residentId}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {profile.purok}, {profile.barangay}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand">{profile.classification}</p>
            </div>
          </div>

          <Button type="button" className="h-11 shrink-0" onClick={() => setShowQr(true)}>
            <QrCode className="size-4" /> Show My QR
          </Button>
        </PanelContent>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <SectionTitle icon={CircleUserRound}>Personal Information</SectionTitle>
          </PanelHeader>
          <PanelContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Full Name">{profile.fullName}</Meta>
            <Meta label="Birthdate">{profile.birthdate}</Meta>
            <Meta label="Age">{age}</Meta>
            <Meta label="Sex">{profile.sex}</Meta>
            <Meta label="Civil Status">{profile.civilStatus}</Meta>
            <Meta label="Classification">{profile.classification}</Meta>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <SectionTitle icon={MapPin}>Address</SectionTitle>
          </PanelHeader>
          <PanelContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Purok">{profile.purok}</Meta>
            <Meta label="Barangay">{profile.barangay}</Meta>
            <Meta label="City / Municipality">{profile.city || NOT_PROVIDED}</Meta>
            <Meta label="Province">{profile.province || NOT_PROVIDED}</Meta>
          </PanelContent>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <SectionTitle icon={Phone}>Contact Information</SectionTitle>
            {!editingContact && (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm font-semibold"
                onClick={() => setEditingContact(true)}
              >
                Edit
              </Button>
            )}
          </PanelHeader>
          <PanelContent>
            <PanelDescription className="mb-3">Editable contact details</PanelDescription>

            {!editingContact ? (
              <div className="grid gap-4">
                <Meta label="Mobile Number">{profile.mobileNumber || NOT_PROVIDED}</Meta>
                <Meta label="Email Address">{profile.email || NOT_PROVIDED}</Meta>

                {profile.email &&
                  (profile.emailVerified ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
                      <Check className="size-3" /> Email verified
                    </span>
                  ) : (
                    <div className="grid gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">
                          Email not verified
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs font-semibold"
                          disabled={resending}
                          onClick={handleResend}
                        >
                          {resending ? "Sending..." : "Resend verification"}
                        </Button>
                      </div>

                      {verificationLink && (
                        <Link
                          to={verificationLink}
                          className="w-fit text-xs font-medium text-brand hover:underline"
                        >
                          Demo · open the verification link
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <form onSubmit={handleSaveContact} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    className="h-10 bg-surface tnum"
                    value={mobileNumber}
                    disabled={savingContact}
                    onChange={(event) => setMobileNumber(event.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-10 bg-surface"
                    value={email}
                    disabled={savingContact}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 bg-surface"
                    disabled={savingContact}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10" disabled={savingContact}>
                    {savingContact ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            )}
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <SectionTitle icon={ShieldCheck}>Account Information</SectionTitle>
          </PanelHeader>
          <PanelContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Resident ID">{profile.residentId}</Meta>
            <Meta label="Account Status">
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                <Check className="size-3" /> {profile.accountStatus}
              </span>
            </Meta>
            <Meta label="Date Registered">{profile.registeredDate}</Meta>
          </PanelContent>
        </Panel>
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning">
                Need to change official information?
              </p>
              <p className="mt-1 text-xs leading-5 text-ink">
                Name, birthdate, civil status, sex, or address changes require barangay
                verification.
              </p>
            </div>
          </div>

          {/* The reference prints no handler for it: officials change these fields. */}
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 border-warning/40 bg-surface text-warning hover:bg-warning/10 hover:text-warning"
          >
            Request Update
          </Button>
        </div>
      </div>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">My QR Code</DialogTitle>
            <DialogDescription className="text-xs leading-5">
              Present this code to authorized barangay staff.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            {profile.qrToken ? (
              <div className="rounded-xl border border-line-soft bg-surface p-3 shadow-card">
                <QrCredential token={profile.qrToken} />
              </div>
            ) : (
              <div className="grid size-[230px] place-items-center rounded-lg bg-canvas p-6 text-center">
                <div>
                  <p className="text-sm font-semibold text-ink-strong">QR Code unavailable</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    Please contact the barangay office.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-ink-strong">{profile.fullName}</p>
            <p className="mt-1 text-sm text-ink-muted tnum">{profile.residentId}</p>
            <p className="mt-2 text-sm font-semibold text-brand">{profile.classification}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              <Check className="size-3" /> Verified Resident
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin
  children: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-[18px]" />
      </span>
      <PanelTitle>{children}</PanelTitle>
    </div>
  )
}

/**
 * The credential the counter scans. UI-only: the modules are derived from the
 * token, so the pattern is stable per resident, but no encoder is attached.
 */
function QrCredential({ token }: { token: string }) {
  const size = 25
  let hash = 2166136261

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  const isDark = (row: number, column: number) => {
    const inFinder =
      (row < 7 && column < 7) ||
      (row < 7 && column >= size - 7) ||
      (row >= size - 7 && column < 7)

    if (inFinder) {
      const r = row < 7 ? row : row - (size - 7)
      const c = column < 7 ? column : column - (size - 7)

      return Math.max(Math.abs(r - 3), Math.abs(c - 3)) !== 2
    }

    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0

    return (hash & 0xff) > 128
  }

  const modules: string[] = []

  for (let row = 0; row < size; row += 1)
    for (let column = 0; column < size; column += 1)
      if (isDark(row, column)) modules.push(`${column} ${row}`)

  return (
    <svg
      width={230}
      height={230}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Resident QR Code"
      className="block size-[230px]"
    >
      <rect width={size} height={size} fill="var(--surface)" />
      <g fill="var(--ink-strong)">
        {modules.map((position) => (
          <rect key={position} x={Number(position.split(" ")[0])} y={Number(position.split(" ")[1])} width={1} height={1} />
        ))}
      </g>
    </svg>
  )
}
