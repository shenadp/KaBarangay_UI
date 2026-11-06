/**
 * `resources/js/pages/Resident/RegistrationApplication.tsx` — the applicant's
 * own view of a registration, reachable only through the application access
 * gate. The correction form is scoped to exactly the fields and documents the
 * admin authorized; everything else on the page is read-only.
 *
 * UI-only: the state comes from the mock registry the Admin desk also reads.
 */
import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CircleAlert, Info, LogOut, ShieldCheck } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Meta, Panel, PanelContent, PanelTitle } from "@/components/Panel"
import {
  CORRECTION_SUBMITTED,
  applicationByReference,
  documentLabelOf,
  resubmitApplication,
  revokeApplicationAccess,
  type ApplicationView,
} from "@/mock/resident/registration"

type Correction = NonNullable<ApplicationView["correction"]>

/** `POST …/correction` — only the authorized targets are ever submitted. */
function CorrectionForm({
  reference,
  correction,
  onSubmitted,
}: {
  reference: string
  correction: Correction
  onSubmitted: () => void
}) {
  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(correction.fields.map((target) => [target.key, target.value])),
  )
  const [files, setFiles] = useState<Record<string, File | null>>(() =>
    Object.fromEntries(correction.documents.map((key) => [key, null])),
  )
  const [banner, setBanner] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBanner(null)
    setSubmitting(true)

    // UI-only auth: the backend integration replaces this delay.
    window.setTimeout(() => {
      const documents = Object.fromEntries(
        Object.entries(files).filter((entry): entry is [string, File] => entry[1] !== null),
      )
      const result = resubmitApplication(reference, fields, documents)
      setSubmitting(false)
      if (!result.ok) {
        setBanner(result.message)
        return
      }
      onSubmitted()
    }, 700)
  }

  return (
    <Panel className="mt-4 p-4 sm:p-5">
      <PanelTitle className="text-base">Correction requested</PanelTitle>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
        {correction.instructions}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        {correction.fields.length > 0 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold tracking-tight text-ink-strong">
              Fields you may correct
            </legend>
            {correction.fields.map((target) => (
              <div key={target.key}>
                <Label htmlFor={`correction-${target.key}`} className="text-ink">
                  {target.label}
                  {target.required && <span className="text-destructive"> *</span>}
                </Label>
                {target.type === "select" ? (
                  <Select
                    value={fields[target.key] ?? ""}
                    onValueChange={(value) => setFields((prev) => ({ ...prev, [target.key]: value }))}
                  >
                    <SelectTrigger
                      id={`correction-${target.key}`}
                      className="mt-1.5 h-11 w-full bg-surface"
                    >
                      <SelectValue placeholder={`Select ${target.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {target.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`correction-${target.key}`}
                    type={target.type}
                    required={target.required}
                    value={fields[target.key] ?? ""}
                    onChange={(event) =>
                      setFields((prev) => ({ ...prev, [target.key]: event.target.value }))
                    }
                    className="mt-1.5 h-11 bg-surface"
                  />
                )}
              </div>
            ))}
          </fieldset>
        )}

        {correction.documents.length > 0 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold tracking-tight text-ink-strong">
              Replacement documents
            </legend>
            {correction.documents.map((key) => (
              <div key={key}>
                <Label htmlFor={`correction-document-${key}`} className="text-ink">
                  {documentLabelOf(key)}
                  <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id={`correction-document-${key}`}
                  type="file"
                  required
                  accept={
                    key === "live_identity_photo"
                      ? "image/jpeg,image/png"
                      : "image/jpeg,image/png,application/pdf"
                  }
                  className="mt-1.5 h-11 bg-surface text-sm"
                  onChange={(event) =>
                    setFiles((prev) => ({ ...prev, [key]: event.target.files?.[0] ?? null }))
                  }
                />
              </div>
            ))}
          </fieldset>
        )}

        <p className="text-xs leading-relaxed text-ink-faint">
          Only the fields and documents listed above can be submitted. Your application remains the
          same application and returns to Pending review after successful resubmission.
        </p>

        {banner && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{banner}</p>
          </div>
        )}

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Resubmit correction"}
        </Button>
      </form>
    </Panel>
  )
}

export default function ApplicationStatus() {
  const { reference = "" } = useParams<{ reference: string }>()
  const navigate = useNavigate()
  const [view, setView] = useState<ApplicationView | null>(() => applicationByReference(reference))
  const [flash, setFlash] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setView(applicationByReference(reference))
  }, [reference])

  function signOut() {
    setSigningOut(true)
    revokeApplicationAccess(reference)
    navigate(`/resident/application/access?reference=${encodeURIComponent(reference)}`, {
      replace: true,
    })
  }

  if (view === null) {
    return (
      <AuthLayout variant="resident">
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
              <Info className="size-6" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-ink-strong">
              Application unavailable
            </h1>
            <p className="text-sm leading-relaxed text-ink-muted">
              This page shows information for the application authenticated in this session. Sign in
              with your application reference and the password you created during registration.
            </p>
            <Button asChild className="mt-1 h-11 w-full">
              <Link to="/resident/application/access">Access your application</Link>
            </Button>
          </div>
        </Panel>
      </AuthLayout>
    )
  }

  const correction = view.status === "needs_correction" && view.canResubmit ? view.correction : null
  const terminal = view.status === "approved" || view.status === "rejected"

  return (
    <AuthLayout variant="resident" maxWidth="max-w-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Secure application access
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={signOut}
          disabled={signingOut}
          className="h-9 px-2 text-sm text-brand"
        >
          <LogOut className="size-4" /> {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>

      {flash && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl border border-line-soft bg-success-soft px-4 py-3 text-sm text-success"
        >
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>{flash}</p>
        </div>
      )}

      <Panel className="p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Application status
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink-strong">
          {view.statusLabel}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This page shows information for the application authenticated in this session. It does not
          create a Resident account or change your application.
        </p>

        <div className="mt-5 grid gap-4 rounded-xl border border-line-soft bg-canvas p-4 min-[440px]:grid-cols-2">
          <Meta label="Applicant">{view.applicantName}</Meta>
          <Meta label="Application reference">
            <span className="break-all font-mono">{view.reference}</span>
          </Meta>
          <Meta label="Barangay">{view.barangay || "—"}</Meta>
          <Meta label="Purok">{view.purok || "—"}</Meta>
          <Meta label="Submitted">
            <span className="tnum">{view.submittedAt || "—"}</span>
          </Meta>
        </div>
      </Panel>

      <Panel className="mt-4 p-4 sm:p-5">
        <PanelTitle>Email notifications</PanelTitle>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Email is optional. If supplied, it may receive the admin decision.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Mobile number – Unverified. Verification is not yet available.
        </p>
      </Panel>

      {correction !== null && (
        <CorrectionForm
          key={`${reference}-${correction.fields.length}-${correction.documents.length}`}
          reference={reference}
          correction={correction}
          onSubmitted={() => {
            setView(applicationByReference(reference))
            setFlash(CORRECTION_SUBMITTED)
          }}
        />
      )}

      {view.status === "needs_correction" && correction === null && (
        <Panel className="mt-4 p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Correction details are temporarily unavailable. Contact your barangay office for
            assistance.
          </p>
        </Panel>
      )}

      {terminal && (
        <Panel className="mt-4">
          <PanelContent className="py-4 text-sm leading-relaxed text-ink-muted">
            This application is read-only.
          </PanelContent>
        </Panel>
      )}

      <p className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
        Access expires after 15 minutes of inactivity and at most 2 hours after sign-in. This page is
        read-only.
      </p>
    </AuthLayout>
  )
}
