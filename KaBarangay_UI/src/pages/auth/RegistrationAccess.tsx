import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel } from "@/components/Panel"
import { authenticateApplication } from "@/mock/resident/registration"

/**
 * `Resident/RegistrationAccess.tsx` — the gate in front of an application.
 * The reference alone never opens it; the password created during
 * registration has to match too, and one answer covers every kind of miss.
 */
export default function RegistrationAccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryReference = params.get("reference")

  const [reference, setReference] = useState(
    queryReference !== null && queryReference.length <= 64 ? queryReference : "",
  )
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setCredentialsError(null)

    const result = authenticateApplication(reference, password)

    window.setTimeout(() => {
      setSubmitting(false)
      setPassword("")

      if (!result.ok) {
        setCredentialsError(result.message)
        return
      }

      navigate(`/resident/application/${encodeURIComponent(result.view.reference)}`)
    }, 600)
  }

  return (
    <AuthLayout variant="resident">
      <div className="mb-5">
        <Link to="/resident/register" className="text-sm font-medium text-brand hover:underline">
          KaBarangay Resident Registration
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink-strong">
          Access your application
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Enter the application reference and the password you created during registration. The
          reference alone does not grant access.
        </p>
      </div>

      <Panel className="p-5 sm:p-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="application-reference">Application reference</Label>
            <Input
              id="application-reference"
              autoComplete="off"
              aria-invalid={credentialsError !== null}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="h-11 bg-surface font-mono text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="application-password">Registration password</Label>
            <Input
              id="application-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={credentialsError !== null}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 bg-surface"
            />
          </div>

          {credentialsError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
            >
              {credentialsError}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing in…
              </>
            ) : (
              "View application"
            )}
          </Button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Access expires after 15 minutes of inactivity and at most 2 hours after sign-in. This page
          is read-only.
        </p>
      </Panel>
    </AuthLayout>
  )
}
