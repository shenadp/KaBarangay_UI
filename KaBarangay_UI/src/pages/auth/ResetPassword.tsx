/**
 * `resources/js/pages/Resident/ResetPassword.tsx` — the link target.
 *
 * `PasswordResetController::reset()` validates the token and the address
 * together, so an unknown pair is refused the same way an expired one is, and
 * the failure lands on the `email` key rather than on a banner. UI-only:
 * `completePasswordReset()` writes the same credential the sign-in page checks.
 */
import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CircleAlert, KeyRound, Loader2 } from "lucide-react"

import AuthLayout from "@/layouts/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel } from "@/components/Panel"
import { RESET_LINK_INVALID, RESET_PASSWORD_FLASH, completePasswordReset } from "@/mock/resident/session"

const resetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Enter a valid email address")
      .max(255, "Keep the email address under 255 characters"),
    password: z.string().min(8, "Use at least 8 characters."),
    password_confirmation: z.string().min(1, "Confirm the new password."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match.",
  })

type ResetValues = z.infer<typeof resetSchema>

export default function ResetPassword() {
  const { token = "" } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      password: "",
      password_confirmation: "",
    },
  })

  const onSubmit = (values: ResetValues) => {
    setSubmitting(true)

    window.setTimeout(() => {
      const result = completePasswordReset({
        token,
        email: values.email,
        password: values.password,
        passwordConfirmation: values.password_confirmation,
      })

      setSubmitting(false)

      if (!result.ok) {
        form.setError("email", { message: result.message })
        return
      }

      navigate("/resident/login", { state: { flash: RESET_PASSWORD_FLASH } })
    }, 600)
  }

  return (
    <AuthLayout variant="resident">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Resident portal
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink-strong">
          Reset Password
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a new password for your resident account.
        </p>
      </div>

      <Panel className="p-5 sm:p-6">
        {form.formState.errors.email && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-xs font-semibold text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{form.formState.errors.email.message ?? RESET_LINK_INVALID}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-account-email">Email Address</Label>
            <Input
              id="reset-account-email"
              type="email"
              autoComplete="email"
              className="h-11 bg-surface"
              {...form.register("email")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="h-11 bg-surface"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reset-password-confirmation">Confirm New Password</Label>
            <Input
              id="reset-password-confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="h-11 bg-surface"
              {...form.register("password_confirmation")}
            />
            {form.formState.errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password_confirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <KeyRound className="size-4" /> Reset Password
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          <Link to="/resident/login" className="font-medium text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </Panel>
    </AuthLayout>
  )
}
