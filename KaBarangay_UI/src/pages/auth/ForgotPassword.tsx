/**
 * `resources/js/pages/Resident/ForgotPassword.tsx` — the address form.
 *
 * `PasswordResetController::sendResetLink()` always answers the same way, so
 * the page cannot be used to discover whether an account exists. UI-only: the
 * token a mailer would send is handed to the demo panel below instead.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel } from "@/components/Panel"
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/forms"
import {
  RESET_LINK_FLASH,
  issuePasswordResetTokens,
  latestResetLink,
} from "@/mock/resident/session"

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = (values: ForgotPasswordValues) => {
    setSubmitting(true)
    setFlash(null)
    setResetLink(null)

    // UI-only auth: the backend integration replaces this handler.
    window.setTimeout(() => {
      const issued = issuePasswordResetTokens(values.email)

      setSubmitting(false)
      setFlash(RESET_LINK_FLASH)
      setResetLink(issued.length > 0 ? latestResetLink(values.email) : null)
      form.reset({ email: "" })
    }, 600)
  }

  return (
    <AuthLayout variant="resident">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Resident portal
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink-strong">
          Forgot Password
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter the email address on your resident account and we will send you a reset link.
        </p>
      </div>

      <Panel className="p-5 sm:p-6">
        {flash && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-xl border border-line-soft bg-success-soft px-4 py-3 text-xs font-semibold text-success"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>{flash}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 bg-surface"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <KeyRound className="size-4" /> Send Reset Link
              </>
            )}
          </Button>
        </form>

        {resetLink && (
          <div className="mt-4 rounded-xl border border-line-soft bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Demo · reset link
            </p>
            <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Mail className="mt-0.5 size-3.5 shrink-0 text-brand" />
              No mailer runs in this UI preview, so the link the email would carry is offered here.
              It works once, for the address above.
            </p>
            <Button asChild variant="outline" className="mt-3 h-10 w-full bg-surface">
              <Link to={resetLink}>Open reset link</Link>
            </Button>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-ink-muted">
          Remembered your password?{" "}
          <Link to="/resident/login" className="font-medium text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </Panel>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
        For security, this page does not confirm whether an account exists.
      </p>
    </AuthLayout>
  )
}
