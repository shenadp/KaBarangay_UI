/**
 * `resources/js/pages/Resident/EmailVerification.tsx` — the landing page for
 * `GET /resident/email/verify/{token}`.
 *
 * `ResidentEmailVerificationController::verify()` answers one of four ways and
 * always renders this same card; the title and message come from the service's
 * status, never from the token itself.
 */
import { Link, useParams } from "react-router-dom"
import { Check, TriangleAlert } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/Panel"
import { resolveEmailVerification, type EmailVerificationStatus } from "@/mock/resident/session"

const COPY: Record<EmailVerificationStatus, { title: string; message: string }> = {
  verified: {
    title: "Email verified",
    message:
      "The Resident email address has been verified. You can close this page. A barangay administrator can now review the claim.",
  },
  expired: {
    title: "Verification link expired",
    message: "This verification link has expired. Return to the claim page and request a new link.",
  },
  email_changed: {
    title: "Email address changed",
    message:
      "The Resident email address changed after this link was issued. Request a new verification link.",
  },
  invalid: {
    title: "Invalid verification link",
    message: "This verification link is invalid or has already been used.",
  },
}

export default function EmailVerified() {
  const { token = "" } = useParams<{ token: string }>()
  const status = resolveEmailVerification(token)
  const copy = COPY[status]
  const success = status === "verified"

  return (
    <AuthLayout variant="resident">
      <Panel className="p-6 text-center sm:p-8">
        <span
          className={
            "mx-auto grid size-16 place-items-center rounded-full " +
            (success ? "bg-brand-soft text-brand" : "bg-warning-soft text-warning")
          }
        >
          {success ? (
            <Check className="size-8" strokeWidth={2.2} />
          ) : (
            <TriangleAlert className="size-8" strokeWidth={2.2} />
          )}
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink-strong">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{copy.message}</p>

        <div className="mt-6 grid gap-2">
          <Button asChild className="h-11 w-full">
            <Link to="/resident/register">Return to Registration</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full bg-surface">
            <Link to="/resident/login">Back to Login</Link>
          </Button>
        </div>
      </Panel>
    </AuthLayout>
  )
}
